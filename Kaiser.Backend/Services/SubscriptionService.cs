using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Kaiser.Backend.Data;
using Kaiser.Backend.Models;

namespace Kaiser.Backend.Services
{
    public interface ISubscriptionService
    {
        Task<(string Content, string UserInfo, bool Success)> GetSubscriptionContentAsync(string? token, string? auth, long? serviceId, string baseUrl);
        Task<SubscriptionStatusDTO?> GetSubscriptionStatusAsync(string? token, long? serviceId, string baseUrl);
        Task<IssueServiceResult> IssueServiceAsync(long orderId, string baseUrl);
        Task<IssueServiceResult> IssueFreeTestAsync(long userId, string baseUrl);
        string GenerateVlessConfig(string uuid, string domain, int port, string path, string sni, string remarks);
    }

    public class SubscriptionService : ISubscriptionService
    {
        private readonly AppDbContext _db;
        private readonly IXuiService _xuiService;
        private readonly ILogger<SubscriptionService> _logger;

        public SubscriptionService(AppDbContext db, IXuiService xuiService, ILogger<SubscriptionService> logger)
        {
            _db = db;
            _xuiService = xuiService;
            _logger = logger;
        }

        public async Task<(string Content, string UserInfo, bool Success)> GetSubscriptionContentAsync(string? token, string? auth, long? serviceId, string baseUrl)
        {
            Service? service = null;

            if (!string.IsNullOrEmpty(token))
            {
                service = await _db.Services.FirstOrDefaultAsync(s => s.Token == token && s.isDelete == 0);
            }
            else if (!string.IsNullOrEmpty(auth))
            {
                service = await _db.Services.FirstOrDefaultAsync(s => s.authorization == auth && s.isDelete == 0);
            }
            else if (serviceId.HasValue)
            {
                service = await _db.Services.FirstOrDefaultAsync(s => s.Id == serviceId.Value && s.isDelete == 0);
            }

            if (service == null)
            {
                return (string.Empty, string.Empty, false);
            }

            // Check if expired or total used reached
            long now = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
            if (service.EndDate > 0 && service.EndDate < now)
            {
                service.State = 0;
            }
            if (service.TotalUsed > 0 && (service.Upload + service.Download) >= service.TotalUsed)
            {
                service.State = 0;
            }
            await _db.SaveChangesAsync();

            // Collect configs
            var configs = await _db.Configs.Where(c => c.ServiceId == service.Id && c.isDelete == 0 && c.State == 1).ToListAsync();
            var configLines = new List<string>();

            if (configs.Any())
            {
                foreach (var conf in configs)
                {
                    if (!string.IsNullOrEmpty(conf.uuid) && (conf.uuid.StartsWith("vless://") || conf.uuid.StartsWith("vmess://") || conf.uuid.StartsWith("trojan://") || conf.uuid.StartsWith("ss://")))
                    {
                        configLines.Add(conf.uuid);
                    }
                    else
                    {
                        var srv = await _db.Servers.FirstOrDefaultAsync(s => s.Id == conf.ServerId);
                        string domain = !string.IsNullOrEmpty(srv?.Domain) ? srv.Domain : "sub.kaiser-cdn.com";
                        string vless = GenerateVlessConfig(conf.uuid ?? Guid.NewGuid().ToString(), domain, 2053, "/kaiser-ws", domain, $"👑 Kaiser VIP - {srv?.Name ?? "Server"}");
                        configLines.Add(vless);
                    }
                }
            }
            else
            {
                // If configs list is empty, generate from assigned servers
                var srv = await _db.Servers.FirstOrDefaultAsync(s => s.State == 1);
                string domain = !string.IsNullOrEmpty(srv?.Domain) ? srv.Domain : "sub.kaiser-cdn.com";
                string vless = GenerateVlessConfig(service.Password ?? Guid.NewGuid().ToString(), domain, 2053, "/kaiser-ws", domain, $"👑 Kaiser VIP - {service.Email}");
                configLines.Add(vless);
            }

            string rawText = string.Join("\n", configLines);
            string base64Content = Convert.ToBase64String(Encoding.UTF8.GetBytes(rawText));

            // Subscription-Userinfo header: upload=...; download=...; total=...; expire=...
            string userInfo = $"upload={service.Upload}; download={service.Download}; total={service.TotalUsed}; expire={service.EndDate}";

            return (base64Content, userInfo, true);
        }

        public async Task<SubscriptionStatusDTO?> GetSubscriptionStatusAsync(string? token, long? serviceId, string baseUrl)
        {
            Service? service = null;
            if (!string.IsNullOrEmpty(token))
            {
                service = await _db.Services.FirstOrDefaultAsync(s => s.Token == token && s.isDelete == 0);
            }
            else if (serviceId.HasValue)
            {
                service = await _db.Services.FirstOrDefaultAsync(s => s.Id == serviceId.Value && s.isDelete == 0);
            }

            if (service == null) return null;

            var plan = await _db.ServerPlans.FirstOrDefaultAsync(p => p.Id == service.PlanId);
            var configs = await _db.Configs.Where(c => c.ServiceId == service.Id && c.isDelete == 0).ToListAsync();

            long now = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
            long daysRemaining = service.EndDate > now ? (service.EndDate - now) / 86400 : 0;
            long used = service.Upload + service.Download;
            double percent = service.TotalUsed > 0 ? Math.Min(100.0, Math.Round((double)used / service.TotalUsed * 100, 1)) : 0;

            string subLink = $"{baseUrl.TrimEnd('/')}/kaiser?token={service.Token}";

            var configList = new List<string>();
            foreach (var c in configs)
            {
                if (!string.IsNullOrEmpty(c.uuid))
                {
                    configList.Add(c.uuid);
                }
            }

            return new SubscriptionStatusDTO
            {
                ServiceId = service.Id,
                Email = service.Email ?? "User",
                PlanName = plan?.PlanName ?? "پلن اختصاصی",
                UsedBytes = used,
                TotalBytes = service.TotalUsed,
                UsedPercent = percent,
                DaysRemaining = daysRemaining,
                ExpireTimestamp = service.EndDate,
                State = service.State,
                StatusText = service.State == 1 ? "فعال و متصل" : "منقضی یا غیرفعال",
                SubLink = subLink,
                Configs = configList
            };
        }

        public async Task<IssueServiceResult> IssueServiceAsync(long orderId, string baseUrl)
        {
            var order = await _db.Orders.FirstOrDefaultAsync(o => o.Id == orderId);
            if (order == null)
            {
                return new IssueServiceResult { Success = false, Message = "سفارش یافت نشد." };
            }

            var plan = await _db.ServerPlans.FirstOrDefaultAsync(p => p.Id == order.PlanId);
            if (plan == null)
            {
                return new IssueServiceResult { Success = false, Message = "پلن مربوطه یافت نشد." };
            }

            long now = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
            long expireTime = now + (plan.MonthCount * 30L * 86400L);
            string token = Guid.NewGuid().ToString("N").Substring(0, 16);
            string email = $"kaiser_{order.UserId}_{new Random().Next(1000, 9999)}";
            string uuid = Guid.NewGuid().ToString();

            // Select servers
            var servers = await _db.Servers.Where(s => s.State == 1).ToListAsync();
            if (!servers.Any())
            {
                servers = new List<Server> { new Server { Id = 1, Name = "Main Node", Domain = "sub.kaiser-cdn.com", State = 1 } };
            }

            var service = new Service
            {
                UserId = order.UserId,
                OrderId = order.Id,
                PlanId = plan.Id,
                Email = email,
                Password = uuid,
                Token = token,
                authorization = Guid.NewGuid().ToString("N"),
                CreateDate = now,
                EndDate = expireTime,
                TotalUsed = plan.Volume > 0 ? plan.Volume : 0,
                State = 1,
                TypeService = order.Type ?? "sub",
                UserLimit = plan.UserLimit > 0 ? plan.UserLimit : 2,
                PhoneNumber = order.PhoneNumber
            };

            _db.Services.Add(service);
            await _db.SaveChangesAsync();

            var configUrls = new List<string>();
            foreach (var srv in servers)
            {
                string srvDomain = !string.IsNullOrEmpty(srv.Domain) ? srv.Domain : "sub.kaiser-cdn.com";
                string confUri = GenerateVlessConfig(uuid, srvDomain, 2053, "/kaiser-ws", srvDomain, $"👑 Kaiser VIP - {srv.Name}");
                configUrls.Add(confUri);

                _db.Configs.Add(new Config
                {
                    ServiceId = service.Id,
                    ServerId = srv.Id,
                    Name = srv.Name ?? "Server",
                    uuid = confUri,
                    State = 1,
                    CreateDate = now,
                    EndDate = expireTime
                });

                // Attempt to add client to X-UI panel
                _ = Task.Run(async () =>
                {
                    try
                    {
                        await _xuiService.AddClientAsync(srv, email, uuid, service.TotalUsed, expireTime, (int)plan.UserLimit);
                    }
                    catch { }
                });
            }

            // Update order status
            order.State = 1;
            order.EndTimePlan = expireTime;
            await _db.SaveChangesAsync();

            string subUrl = $"{baseUrl.TrimEnd('/')}/kaiser?token={token}";

            return new IssueServiceResult
            {
                Success = true,
                ServiceId = service.Id,
                Token = token,
                SubUrl = subUrl,
                ConfigUrls = configUrls,
                Message = "سرویس با موفقیت صادر و فعال شد."
            };
        }

        public async Task<IssueServiceResult> IssueFreeTestAsync(long userId, string baseUrl)
        {
            var user = await _db.Users.FirstOrDefaultAsync(u => u.UserId == userId);
            if (user == null)
            {
                user = new User { UserId = userId, TimeJoin = DateTimeOffset.UtcNow.ToUnixTimeSeconds() };
                _db.Users.Add(user);
                await _db.SaveChangesAsync();
            }

            if (user.UseFreeTrial == 1)
            {
                return new IssueServiceResult { Success = false, Message = "شما قبلاً از تست رایگان استفاده کرده‌اید." };
            }

            long gb = 1024L * 1024L * 1024L;
            long now = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
            long expireTime = now + 86400L;
            string token = Guid.NewGuid().ToString("N").Substring(0, 16);
            string email = $"kaiser_test_{userId}_{new Random().Next(100, 999)}";
            string uuid = Guid.NewGuid().ToString();

            var service = new Service
            {
                UserId = userId,
                OrderId = 0,
                PlanId = 0,
                Email = email,
                Password = uuid,
                Token = token,
                authorization = Guid.NewGuid().ToString("N"),
                CreateDate = now,
                EndDate = expireTime,
                TotalUsed = 1L * gb,
                State = 1,
                TypeService = "test",
                UserLimit = 1
            };

            _db.Services.Add(service);
            user.UseFreeTrial = 1;
            await _db.SaveChangesAsync();

            var srv = await _db.Servers.FirstOrDefaultAsync(s => s.State == 1);
            string srvDomain = !string.IsNullOrEmpty(srv?.Domain) ? srv.Domain : "sub.kaiser-cdn.com";
            string confUri = GenerateVlessConfig(uuid, srvDomain, 2053, "/kaiser-ws", srvDomain, "🎁 Kaiser Free Test - 24h");

            _db.Configs.Add(new Config
            {
                ServiceId = service.Id,
                ServerId = srv?.Id ?? 1,
                Name = "🎁 تست رایگان ۲۴ ساعته",
                uuid = confUri,
                State = 1,
                CreateDate = now,
                EndDate = expireTime
            });
            await _db.SaveChangesAsync();

            string subUrl = $"{baseUrl.TrimEnd('/')}/kaiser?token={token}";

            return new IssueServiceResult
            {
                Success = true,
                ServiceId = service.Id,
                Token = token,
                SubUrl = subUrl,
                ConfigUrls = new List<string> { confUri },
                Message = "اکانت تست رایگان با موفقیت برای شما فعال شد."
            };
        }

        public string GenerateVlessConfig(string uuid, string domain, int port, string path, string sni, string remarks)
        {
            string encodedRemarks = Uri.EscapeDataString(remarks);
            return $"vless://{uuid}@{domain}:{port}?type=ws&security=tls&path={Uri.EscapeDataString(path)}&host={sni}&sni={sni}#{encodedRemarks}";
        }
    }
}

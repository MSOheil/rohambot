using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Kaiser.Backend.Data;
using Kaiser.Backend.Models;
using Kaiser.Backend.Services;

namespace Kaiser.Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AdminController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly IXuiService _xuiService;
        private readonly ISubscriptionService _subscriptionService;

        public AdminController(AppDbContext db, IXuiService xuiService, ISubscriptionService subscriptionService)
        {
            _db = db;
            _xuiService = xuiService;
            _subscriptionService = subscriptionService;
        }

        [HttpGet("dashboard")]
        public async Task<IActionResult> GetDashboard()
        {
            var totalUsers = await _db.Users.CountAsync();
            var activeServices = await _db.Services.CountAsync(s => s.State == 1 && s.isDelete == 0);
            var totalServers = await _db.Servers.CountAsync();
            var onlineServers = await _db.Servers.CountAsync(s => s.Connection == 1 && s.State == 1);
            var totalOrders = await _db.Orders.CountAsync(o => o.State == 1);
            var totalRevenue = await _db.Orders.Where(o => o.State == 1).SumAsync(o => o.PriceAfterDiscount > 0 ? o.PriceAfterDiscount : o.Price);
            var activeDiscounts = await _db.Discounts.CountAsync(d => d.Status == 1);
            var pendingTickets = await _db.Tickets.CountAsync(t => t.Answer == 0);

            // Recent 5 services
            var recent = await (from s in _db.Services.Where(s => s.isDelete == 0).OrderByDescending(s => s.Id).Take(5)
                                join p in _db.ServerPlans on s.PlanId equals p.Id into pGroup
                                from plan in pGroup.DefaultIfEmpty()
                                select new RecentServiceDTO
                                {
                                    Id = s.Id,
                                    UserId = s.UserId,
                                    Email = s.Email ?? "User",
                                    PlanName = plan != null ? plan.PlanName ?? "پلن اختصاصی" : "پلن اختصاصی",
                                    TotalUsed = s.Upload + s.Download,
                                    TotalLimit = s.TotalUsed,
                                    EndDate = s.EndDate,
                                    State = s.State,
                                    Token = s.Token ?? ""
                                }).ToListAsync();

            // Real 7-day sales from database
            var salesChart = new List<DailySalesDTO>();
            var pc = new System.Globalization.PersianCalendar();
            var nowUtc = DateTime.UtcNow;

            for (int i = 6; i >= 0; i--)
            {
                var dayDate = nowUtc.Date.AddDays(-i);
                var nextDayDate = dayDate.AddDays(1);
                long startUnix = ((DateTimeOffset)dayDate).ToUnixTimeSeconds();
                long endUnix = ((DateTimeOffset)nextDayDate).ToUnixTimeSeconds();

                var dayTotal = await _db.Orders
                    .Where(o => o.State == 1 && o.DateTime >= startUnix && o.DateTime < endUnix)
                    .SumAsync(o => (long?)(o.PriceAfterDiscount > 0 ? o.PriceAfterDiscount : o.Price)) ?? 0;

                string dayName = dayDate.DayOfWeek switch
                {
                    DayOfWeek.Saturday => "شنبه",
                    DayOfWeek.Sunday => "یکشنبه",
                    DayOfWeek.Monday => "دوشنبه",
                    DayOfWeek.Tuesday => "سه‌شنبه",
                    DayOfWeek.Wednesday => "چهارشنبه",
                    DayOfWeek.Thursday => "پنجشنبه",
                    DayOfWeek.Friday => "جمعه",
                    _ => ""
                };
                var shamsiDate = $"{pc.GetMonth(dayDate):00}/{pc.GetDayOfMonth(dayDate):00}";

                salesChart.Add(new DailySalesDTO
                {
                    Date = $"{dayName} ({shamsiDate})",
                    Amount = dayTotal
                });
            }

            // Real Server Traffic Distribution from database
            var servers = await _db.Servers.Where(s => s.State == 1).ToListAsync();
            var trafficChart = new List<ServerTrafficDTO>();
            var allServices = await _db.Services.Where(s => s.isDelete == 0).ToListAsync();
            long totalTrafficAllServers = allServices.Sum(s => s.Upload + s.Download);

            foreach (var server in servers)
            {
                var serverIdStr = server.Id.ToString();
                var serverCatIds = await _db.ServerCats.Where(sc => sc.ServerId == server.Id).Select(sc => sc.CatId).ToListAsync();

                long serverTraffic = allServices
                    .Where(s => (s.ServerIds != null && s.ServerIds.Contains(serverIdStr)) || serverCatIds.Contains(s.CatId) || s.CatId == server.CatId)
                    .Sum(s => s.Upload + s.Download);

                int percentage = totalTrafficAllServers > 0 ? (int)((serverTraffic * 100) / totalTrafficAllServers) : 0;

                trafficChart.Add(new ServerTrafficDTO
                {
                    ServerName = server.Name ?? $"سرور #{server.Id}",
                    TrafficBytes = serverTraffic,
                    Percentage = percentage
                });
            }

            return Ok(new DashboardStatsDTO
            {
                TotalUsers = totalUsers,
                ActiveServices = activeServices,
                TotalServers = totalServers,
                OnlineServers = onlineServers,
                TotalOrders = totalOrders,
                TotalRevenue = totalRevenue,
                ActiveDiscounts = activeDiscounts,
                PendingTickets = pendingTickets,
                RecentServices = recent,
                SalesChart = salesChart,
                TrafficChart = trafficChart
            });
        }

        // --- SERVERS ---
        [HttpGet("servers")]
        public async Task<IActionResult> GetServers() => Ok(await _db.Servers.ToListAsync());

        [HttpPost("servers")]
        public async Task<IActionResult> CreateServer([FromBody] CreateServerRequest req)
        {
            var server = new Server
            {
                Name = req.Name,
                Url = req.Url,
                User = req.User,
                Password = req.Password,
                PanelType = req.PanelType,
                Domain = req.Domain,
                InboundId = req.InboundId,
                CatId = req.CatId,
                State = 1,
                Connection = 1
            };
            _db.Servers.Add(server);
            await _db.SaveChangesAsync();
            return Ok(server);
        }

        [HttpPut("servers/{id}")]
        public async Task<IActionResult> UpdateServer(long id, [FromBody] CreateServerRequest req)
        {
            var server = await _db.Servers.FindAsync(id);
            if (server == null) return NotFound();

            server.Name = req.Name;
            server.Url = req.Url;
            server.User = req.User;
            server.Password = req.Password;
            server.PanelType = req.PanelType;
            server.Domain = req.Domain;
            server.InboundId = req.InboundId;
            server.CatId = req.CatId;

            await _db.SaveChangesAsync();
            return Ok(server);
        }

        [HttpDelete("servers/{id}")]
        public async Task<IActionResult> DeleteServer(long id)
        {
            var server = await _db.Servers.FindAsync(id);
            if (server == null) return NotFound();
            _db.Servers.Remove(server);
            await _db.SaveChangesAsync();
            return Ok(new { success = true });
        }

        [HttpPost("servers/{id}/ping")]
        public async Task<IActionResult> PingServer(long id)
        {
            var server = await _db.Servers.FindAsync(id);
            if (server == null) return NotFound();
            var res = await _xuiService.TestConnectionAsync(server);
            return Ok(res);
        }

        // --- CATEGORIES ---
        [HttpGet("categories")]
        public async Task<IActionResult> GetCategories() => Ok(await _db.Categories.ToListAsync());

        [HttpPost("categories")]
        public async Task<IActionResult> CreateCategory([FromBody] CreateCategoryRequest req)
        {
            var cat = new Category { Title = req.Title, Parent = req.Parent, Show = req.Show, TypeServices = req.TypeServices };
            _db.Categories.Add(cat);
            await _db.SaveChangesAsync();
            return Ok(cat);
        }

        [HttpDelete("categories/{id}")]
        public async Task<IActionResult> DeleteCategory(long id)
        {
            var cat = await _db.Categories.FindAsync(id);
            if (cat == null) return NotFound();
            _db.Categories.Remove(cat);
            await _db.SaveChangesAsync();
            return Ok(new { success = true });
        }

        // --- PLANS ---
        [HttpGet("plans")]
        public async Task<IActionResult> GetPlans() => Ok(await _db.ServerPlans.ToListAsync());

        [HttpPost("plans")]
        public async Task<IActionResult> CreatePlan([FromBody] CreatePlanRequest req)
        {
            long gb = 1024L * 1024L * 1024L;
            var plan = new ServerPlan
            {
                PlanName = req.PlanName,
                Description = req.Description,
                MonthCount = req.MonthCount,
                Price = req.Price,
                Volume = req.VolumeGB * gb,
                CatId = req.CatId,
                UserLimit = req.UserLimit,
                SpeedLimit = req.SpeedLimit
            };
            _db.ServerPlans.Add(plan);
            await _db.SaveChangesAsync();
            return Ok(plan);
        }

        [HttpDelete("plans/{id}")]
        public async Task<IActionResult> DeletePlan(long id)
        {
            var plan = await _db.ServerPlans.FindAsync(id);
            if (plan == null) return NotFound();
            _db.ServerPlans.Remove(plan);
            await _db.SaveChangesAsync();
            return Ok(new { success = true });
        }

        // --- SERVICES ---
        [HttpGet("services")]
        public async Task<IActionResult> GetServices() => Ok(await _db.Services.Where(s => s.isDelete == 0).OrderByDescending(s => s.Id).ToListAsync());

        [HttpPost("services/{id}/toggle")]
        public async Task<IActionResult> ToggleService(long id)
        {
            var service = await _db.Services.FindAsync(id);
            if (service == null) return NotFound();
            service.State = service.State == 1 ? 0 : 1;
            await _db.SaveChangesAsync();
            return Ok(service);
        }

        [HttpDelete("services/{id}")]
        public async Task<IActionResult> DeleteService(long id)
        {
            var service = await _db.Services.FindAsync(id);
            if (service == null) return NotFound();
            service.isDelete = 1;
            await _db.SaveChangesAsync();
            return Ok(new { success = true });
        }

        // --- USERS ---
        [HttpGet("users")]
        public async Task<IActionResult> GetUsers() => Ok(await _db.Users.OrderByDescending(u => u.Id).ToListAsync());

        [HttpPost("users/wallet")]
        public async Task<IActionResult> UpdateWallet([FromBody] UpdateWalletRequest req)
        {
            var user = await _db.Users.FirstOrDefaultAsync(u => u.UserId == req.UserId);
            if (user == null) return NotFound();
            user.Wallet += req.Amount;
            await _db.SaveChangesAsync();
            return Ok(user);
        }

        // --- ORDERS ---
        [HttpGet("orders")]
        public async Task<IActionResult> GetOrders() => Ok(await _db.Orders.OrderByDescending(o => o.Id).ToListAsync());

        [HttpPost("orders/{id}/approve")]
        public async Task<IActionResult> ApproveOrder(long id)
        {
            var setting = await _db.Settings.FirstOrDefaultAsync();
            string baseUrl = setting?.SubDomain != null ? $"https://{setting.SubDomain}" : "https://sub.kaiser-cdn.com";
            var result = await _subscriptionService.IssueServiceAsync(id, baseUrl);
            return Ok(result);
        }

        [HttpPost("orders/{id}/reject")]
        public async Task<IActionResult> RejectOrder(long id)
        {
            var order = await _db.Orders.FindAsync(id);
            if (order == null) return NotFound();
            order.State = 2; // rejected
            await _db.SaveChangesAsync();
            return Ok(order);
        }

        // --- DISCOUNTS ---
        [HttpGet("discounts")]
        public async Task<IActionResult> GetDiscounts() => Ok(await _db.Discounts.ToListAsync());

        [HttpPost("discounts")]
        public async Task<IActionResult> CreateDiscount([FromBody] Discount discount)
        {
            discount.DateStart = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
            _db.Discounts.Add(discount);
            await _db.SaveChangesAsync();
            return Ok(discount);
        }

        // --- TICKETS ---
        [HttpGet("tickets")]
        public async Task<IActionResult> GetTickets() => Ok(await _db.Tickets.OrderByDescending(t => t.Id).ToListAsync());

        [HttpPost("tickets/reply")]
        public async Task<IActionResult> ReplyTicket([FromBody] ReplyTicketRequest req)
        {
            var ticket = await _db.Tickets.FindAsync(req.TicketId);
            if (ticket == null) return NotFound();
            ticket.Answer = 1;
            ticket.AdminReply = req.ReplyText;
            await _db.SaveChangesAsync();
            return Ok(ticket);
        }

        // --- APPS ---
        [HttpGet("apps")]
        public async Task<IActionResult> GetApps() => Ok(await _db.AppSuggestments.ToListAsync());

        [HttpPost("apps")]
        public async Task<IActionResult> CreateApp([FromBody] AppSuggestment app)
        {
            _db.AppSuggestments.Add(app);
            await _db.SaveChangesAsync();
            return Ok(app);
        }

        // --- SETTINGS ---
        [HttpGet("settings")]
        public async Task<IActionResult> GetSettings() => Ok(await _db.Settings.FirstOrDefaultAsync() ?? new Setting());

        [HttpPut("settings")]
        public async Task<IActionResult> UpdateSettings([FromBody] Setting updated)
        {
            var current = await _db.Settings.FirstOrDefaultAsync();
            if (current == null)
            {
                _db.Settings.Add(updated);
            }
            else
            {
                _db.Entry(current).CurrentValues.SetValues(updated);
            }
            await _db.SaveChangesAsync();
            return Ok(updated);
        }
    }
}

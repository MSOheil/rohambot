using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Kaiser.Backend.Data;
using Kaiser.Backend.Models;
using Kaiser.Backend.Services;

namespace Kaiser.Backend.Controllers
{
    [ApiController]
    [Route("api/bot")]
    public class BotApiController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly ISubscriptionService _subscriptionService;
        private readonly IConfiguration _config;
        private readonly IHttpClientFactory _httpClientFactory;

        public BotApiController(
            AppDbContext db, 
            ISubscriptionService subscriptionService,
            IConfiguration config,
            IHttpClientFactory httpClientFactory)
        {
            _db = db;
            _subscriptionService = subscriptionService;
            _config = config;
            _httpClientFactory = httpClientFactory;
        }

        [HttpGet("user/{telegramId}")]
        public async Task<IActionResult> GetOrCreateUser(long telegramId, [FromQuery] string? userName, [FromQuery] string? name, [FromQuery] long? inviterId)
        {
            bool isNew = false;
            var user = await _db.Users.FirstOrDefaultAsync(u => u.UserId == telegramId);
            if (user == null)
            {
                isNew = true;
                user = new User
                {
                    UserId = telegramId,
                    UserName = userName,
                    Name = name ?? "User",
                    TimeJoin = DateTimeOffset.UtcNow.ToUnixTimeSeconds(),
                    InvitedFrom = inviterId ?? 0,
                    STEP = "start"
                };
                _db.Users.Add(user);

                if (inviterId.HasValue && inviterId.Value > 0)
                {
                    var inviter = await _db.Users.FirstOrDefaultAsync(u => u.UserId == inviterId.Value);
                    if (inviter != null)
                    {
                        inviter.Invited += 1;
                        var setting = await _db.Settings.FirstOrDefaultAsync();
                        inviter.Wallet += (setting?.RewardInvite ?? 10) * 1000;
                    }
                }

                await _db.SaveChangesAsync();
            }
            else
            {
                if (!string.IsNullOrEmpty(userName) && user.UserName != userName) user.UserName = userName;
                if (!string.IsNullOrEmpty(name) && user.Name != name) user.Name = name;
                await _db.SaveChangesAsync();
            }

            var totalUsers = await _db.Users.CountAsync();
            var activeServices = await _db.Services.CountAsync(s => s.State == 1 && s.isDelete == 0);
            long todayStart = ((DateTimeOffset)DateTime.UtcNow.Date).ToUnixTimeSeconds();
            var todayNewUsers = await _db.Users.CountAsync(u => u.TimeJoin >= todayStart);

            return Ok(new
            {
                user.Id,
                user.UserId,
                user.UserName,
                user.Name,
                user.IsAdmin,
                user.IsBlock,
                user.Wallet,
                user.UseFreeTrial,
                user.Invited,
                user.STEP,
                isNew,
                totalUsers,
                todayNewUsers,
                activeServices
            });
        }

        [HttpPost("user/{telegramId}/step")]
        public async Task<IActionResult> UpdateUserStep(long telegramId, [FromBody] UpdateStepRequest req)
        {
            var user = await _db.Users.FirstOrDefaultAsync(u => u.UserId == telegramId);
            if (user == null) return NotFound();
            user.STEP = req.Step;
            await _db.SaveChangesAsync();
            return Ok(new { success = true, step = req.Step });
        }

        public class UpdateStepRequest
        {
            public string Step { get; set; } = "start";
        }

        [HttpGet("settings")]
        public async Task<IActionResult> GetBotSettings()
        {
            var setting = await _db.Settings.FirstOrDefaultAsync() ?? new Setting();
            return Ok(setting);
        }

        [HttpGet("catalog")]
        public async Task<IActionResult> GetCatalog()
        {
            var categories = await _db.Categories.Where(c => c.Show == 1).ToListAsync();
            var plans = await _db.ServerPlans.ToListAsync();
            return Ok(new { categories, plans });
        }

        [HttpPost("freetest/{telegramId}")]
        public async Task<IActionResult> GetFreeTest(long telegramId)
        {
            var setting = await _db.Settings.FirstOrDefaultAsync();
            string baseUrl = setting?.SubDomain != null ? $"https://{setting.SubDomain}" : $"{Request.Scheme}://{Request.Host}";
            var result = await _subscriptionService.IssueFreeTestAsync(telegramId, baseUrl);
            return Ok(result);
        }

        [HttpGet("user/{telegramId}/services")]
        public async Task<IActionResult> GetUserServices(long telegramId)
        {
            var services = await _db.Services.Where(s => s.UserId == telegramId && s.isDelete == 0).OrderByDescending(s => s.Id).ToListAsync();
            var resultList = new List<object>();

            var setting = await _db.Settings.FirstOrDefaultAsync();
            string baseUrl = setting?.SubDomain != null ? $"https://{setting.SubDomain}" : $"{Request.Scheme}://{Request.Host}";

            foreach (var s in services)
            {
                var plan = await _db.ServerPlans.FirstOrDefaultAsync(p => p.Id == s.PlanId);
                long now = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
                long daysRemaining = s.EndDate > now ? (s.EndDate - now) / 86400 : 0;
                long used = s.Upload + s.Download;

                resultList.Add(new
                {
                    s.Id,
                    s.Email,
                    PlanName = plan?.PlanName ?? "تست رایگان",
                    s.TotalUsed,
                    UsedBytes = used,
                    DaysRemaining = daysRemaining,
                    s.State,
                    SubLink = $"{baseUrl.TrimEnd('/')}/kaiser?token={s.Token}"
                });
            }

            return Ok(resultList);
        }

        [HttpPost("ticket")]
        public async Task<IActionResult> CreateTicket([FromBody] CreateTicketRequest req)
        {
            var ticket = new Ticket
            {
                UserId = req.UserId,
                Description = req.Message,
                Answer = 0
            };
            _db.Tickets.Add(ticket);
            await _db.SaveChangesAsync();
            return Ok(new { success = true, ticketId = ticket.Id });
        }

        public class CreateTicketRequest
        {
            public long UserId { get; set; }
            public string Message { get; set; } = "";
        }

        [HttpPost("wallet/transfer")]
        public async Task<IActionResult> TransferWallet([FromBody] TransferWalletRequest req)
        {
            var sender = await _db.Users.FirstOrDefaultAsync(u => u.UserId == req.SenderId);
            var receiver = await _db.Users.FirstOrDefaultAsync(u => u.UserId == req.ReceiverId);

            if (sender == null || receiver == null)
            {
                return BadRequest(new { success = false, message = "کاربر فرستنده یا گیرنده یافت نشد." });
            }

            if (sender.Wallet < req.Amount)
            {
                return BadRequest(new { success = false, message = "موجودی کیف پول شما کافی نیست." });
            }

            sender.Wallet -= req.Amount;
            receiver.Wallet += req.Amount;
            await _db.SaveChangesAsync();

            return Ok(new { success = true, message = "انتقال اعتبار با موفقیت انجام شد." });
        }

        public class TransferWalletRequest
        {
            public long SenderId { get; set; }
            public long ReceiverId { get; set; }
            public long Amount { get; set; }
        }

        // --- WEBHOOK MANAGEMENT APIS ---
        [HttpPost("set-webhook")]
        public async Task<IActionResult> SetWebhook([FromQuery] string? token, [FromQuery] string? webhookUrl)
        {
            var botToken = !string.IsNullOrEmpty(token) ? token : _config["KaiserConfig:BotToken"] ?? Environment.GetEnvironmentVariable("KaiserConfig__BotToken");
            var baseUrl = !string.IsNullOrEmpty(webhookUrl) ? webhookUrl : _config["KaiserConfig:WebhookUrl"] ?? Environment.GetEnvironmentVariable("KaiserConfig__WebhookUrl") ?? "https://botrohamapi.goodino24.ir";
            var targetEndpoint = $"{baseUrl.TrimEnd('/')}/bot-webhook";

            if (string.IsNullOrEmpty(botToken))
            {
                return BadRequest(new { success = false, message = "Bot token is not configured." });
            }

            try
            {
                var client = _httpClientFactory.CreateClient();
                var payload = new
                {
                    url = targetEndpoint,
                    drop_pending_updates = true,
                    allowed_updates = new[] { "message", "callback_query", "channel_post", "chat_member" }
                };

                var jsonContent = new StringContent(JsonSerializer.Serialize(payload), System.Text.Encoding.UTF8, "application/json");
                var response = await client.PostAsync($"https://api.telegram.org/bot{botToken}/setWebhook", jsonContent);
                var resStr = await response.Content.ReadAsStringAsync();

                return Content(resStr, "application/json");
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }

        [HttpGet("webhook-info")]
        public async Task<IActionResult> GetWebhookInfo([FromQuery] string? token)
        {
            var botToken = !string.IsNullOrEmpty(token) ? token : _config["KaiserConfig:BotToken"] ?? Environment.GetEnvironmentVariable("KaiserConfig__BotToken");
            if (string.IsNullOrEmpty(botToken))
            {
                return BadRequest(new { success = false, message = "Bot token is not configured." });
            }

            try
            {
                var client = _httpClientFactory.CreateClient();
                var response = await client.GetAsync($"https://api.telegram.org/bot{botToken}/getWebhookInfo");
                var resStr = await response.Content.ReadAsStringAsync();

                return Content(resStr, "application/json");
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }
    }
}

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

        public BotApiController(AppDbContext db, ISubscriptionService subscriptionService)
        {
            _db = db;
            _subscriptionService = subscriptionService;
        }

        [HttpGet("user/{telegramId}")]
        public async Task<IActionResult> GetOrCreateUser(long telegramId, [FromQuery] string? userName, [FromQuery] string? name, [FromQuery] long? inviterId)
        {
            var user = await _db.Users.FirstOrDefaultAsync(u => u.UserId == telegramId);
            if (user == null)
            {
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

            return Ok(user);
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
    }
}

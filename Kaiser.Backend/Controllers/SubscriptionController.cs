using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Kaiser.Backend.Data;
using Kaiser.Backend.Models;
using Kaiser.Backend.Services;

namespace Kaiser.Backend.Controllers
{
    [ApiController]
    public class SubscriptionController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly ISubscriptionService _subscriptionService;

        public SubscriptionController(AppDbContext db, ISubscriptionService subscriptionService)
        {
            _db = db;
            _subscriptionService = subscriptionService;
        }

        [HttpGet("/kaiser")]
        public async Task<IActionResult> GetSubscription([FromQuery] string? token, [FromQuery] string? auth, [FromQuery] long? serviceId)
        {
            string baseUrl = $"{Request.Scheme}://{Request.Host}";
            var (content, userInfo, success) = await _subscriptionService.GetSubscriptionContentAsync(token, auth, serviceId, baseUrl);

            if (!success)
            {
                return NotFound("Subscription not found or expired.");
            }

            if (!string.IsNullOrEmpty(userInfo))
            {
                Response.Headers.Append("Subscription-Userinfo", userInfo);
                Response.Headers.Append("profile-update-interval", "6");
            }

            return Content(content, "text/plain; charset=utf-8");
        }

        [HttpGet("/state")]
        [HttpGet("/state/{token}")]
        public async Task<IActionResult> GetSubscriptionState([FromRoute] string? token, [FromQuery] string? tokenQuery, [FromQuery] long? serviceId)
        {
            string searchToken = token ?? tokenQuery ?? "";
            string baseUrl = $"{Request.Scheme}://{Request.Host}";
            var status = await _subscriptionService.GetSubscriptionStatusAsync(searchToken, serviceId, baseUrl);

            if (status == null)
            {
                return NotFound(new { message = "اشتراک یافت نشد یا منقضی شده است." });
            }

            return Ok(status);
        }

        [HttpGet("/getUserService")]
        public async Task<IActionResult> GetUserService([FromQuery] long userId)
        {
            var services = await _db.Services.Where(s => s.UserId == userId && s.isDelete == 0).ToListAsync();
            return Ok(services);
        }

        [HttpGet("/getTest")]
        public async Task<IActionResult> GetTest([FromQuery] long userId)
        {
            string baseUrl = $"{Request.Scheme}://{Request.Host}";
            var result = await _subscriptionService.IssueFreeTestAsync(userId, baseUrl);
            return Ok(result);
        }

        [HttpPost("/createOrder")]
        public async Task<IActionResult> CreateOrder([FromBody] CreateOrderRequest req)
        {
            var plan = await _db.ServerPlans.FindAsync(req.PlanId);
            if (plan == null) return BadRequest("Plan not found");

            long finalPrice = plan.Price;
            long discountId = 0;

            if (!string.IsNullOrEmpty(req.DiscountCode))
            {
                var disc = await _db.Discounts.FirstOrDefaultAsync(d => d.DiscountCode == req.DiscountCode && d.Status == 1 && d.CanUse > 0);
                if (disc != null)
                {
                    discountId = disc.Id;
                    finalPrice = (long)(finalPrice * (1.0 - (disc.Percent / 100.0)));
                    disc.CanUse -= 1;
                }
            }

            var order = new Order
            {
                UserId = req.UserId,
                PlanId = plan.Id,
                Type = req.Type,
                Price = plan.Price,
                PriceAfterDiscount = finalPrice,
                DiscountId = discountId,
                ServerId = req.ServerId,
                CatId = req.CatId > 0 ? req.CatId : plan.CatId,
                PhoneNumber = req.PhoneNumber,
                DateTime = DateTimeOffset.UtcNow.ToUnixTimeSeconds(),
                State = 0
            };

            _db.Orders.Add(order);
            await _db.SaveChangesAsync();

            return Ok(new CreateOrderResponse
            {
                Success = true,
                OrderId = order.Id,
                FinalPrice = finalPrice,
                Message = "سفارش با موفقیت ثبت شد."
            });
        }

        [HttpGet("/getCategory")]
        public async Task<IActionResult> GetCategory() => Ok(await _db.Categories.Where(c => c.Show == 1).ToListAsync());

        [HttpGet("/getServerCat")]
        public async Task<IActionResult> GetServerCat([FromQuery] long catId)
        {
            var servers = await _db.Servers.Where(s => s.CatId == catId && s.State == 1).ToListAsync();
            return Ok(servers);
        }

        [HttpGet("/getserverPlan")]
        public async Task<IActionResult> GetServerPlan([FromQuery] long catId)
        {
            var plans = await _db.ServerPlans.Where(p => p.CatId == catId).ToListAsync();
            return Ok(plans);
        }
    }
}

using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Kaiser.Backend.Data;
using Kaiser.Backend.Models;
using Kaiser.Backend.Services;

namespace Kaiser.Backend.Controllers
{
    [ApiController]
    public class PaymentController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly IPaymentService _paymentService;

        public PaymentController(AppDbContext db, IPaymentService paymentService)
        {
            _db = db;
            _paymentService = paymentService;
        }

        [HttpGet("/onlinepay")]
        public async Task<IActionResult> OnlinePay([FromQuery] long orderId)
        {
            string baseUrl = $"{Request.Scheme}://{Request.Host}";
            var (success, paymentUrl, message) = await _paymentService.RequestZibalPaymentAsync(orderId, baseUrl);

            if (success && !string.IsNullOrEmpty(paymentUrl))
            {
                return Redirect(paymentUrl);
            }

            return BadRequest(new { success = false, message });
        }

        [HttpGet("/CallBackDataZipal")]
        public async Task<IActionResult> CallBackDataZipal([FromQuery] string trackId, [FromQuery] string success, [FromQuery] string status)
        {
            var result = await _paymentService.VerifyZibalPaymentAsync(trackId, status);
            if (result.Success)
            {
                return Content($"<html dir='rtl'><body style='background:#111;color:#fff;font-family:sans-serif;text-align:center;padding:50px;'><h1 style='color:#10b981'>پرداخت با موفقیت انجام شد ✅</h1><p>سفارش #{result.OrderId} تایید شد و اشتراک شما فعال گردید. به ربات تلگرام بازگردید.</p></body></html>", "text/html; charset=utf-8");
            }

            return Content($"<html dir='rtl'><body style='background:#111;color:#fff;font-family:sans-serif;text-align:center;padding:50px;'><h1 style='color:#ef4444'>خطا در پرداخت ❌</h1><p>{result.Message}</p></body></html>", "text/html; charset=utf-8");
        }

        [HttpGet("/successpay")]
        public IActionResult SuccessPay()
        {
            return Content("<html dir='rtl'><body style='background:#111;color:#fff;font-family:sans-serif;text-align:center;padding:50px;'><h1 style='color:#10b981'>عملیات موفقیت‌آمیز بود ✅</h1></body></html>", "text/html; charset=utf-8");
        }
    }
}

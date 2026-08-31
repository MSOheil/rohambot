using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using Microsoft.EntityFrameworkCore;
using Kaiser.Backend.Data;
using Kaiser.Backend.Models;

namespace Kaiser.Backend.Services
{
    public interface IPaymentService
    {
        Task<(bool Success, string PaymentUrl, string Message)> RequestZibalPaymentAsync(long orderId, string callbackBaseUrl);
        Task<(bool Success, string Message, long OrderId)> VerifyZibalPaymentAsync(string trackId, string status);
    }

    public class PaymentService : IPaymentService
    {
        private readonly AppDbContext _db;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly ISubscriptionService _subscriptionService;
        private readonly ILogger<PaymentService> _logger;

        public PaymentService(AppDbContext db, IHttpClientFactory httpClientFactory, ISubscriptionService subscriptionService, ILogger<PaymentService> logger)
        {
            _db = db;
            _httpClientFactory = httpClientFactory;
            _subscriptionService = subscriptionService;
            _logger = logger;
        }

        public async Task<(bool Success, string PaymentUrl, string Message)> RequestZibalPaymentAsync(long orderId, string callbackBaseUrl)
        {
            var order = await _db.Orders.FirstOrDefaultAsync(o => o.Id == orderId);
            if (order == null)
            {
                return (false, string.Empty, "سفارش یافت نشد.");
            }

            var setting = await _db.Settings.FirstOrDefaultAsync();
            string merchant = "zibal"; // default merchant or from settings

            long amountRial = order.PriceAfterDiscount > 0 ? order.PriceAfterDiscount * 10 : order.Price * 10;
            string callbackUrl = $"{callbackBaseUrl.TrimEnd('/')}/CallBackDataZipal";

            try
            {
                var client = _httpClientFactory.CreateClient();
                var payload = new
                {
                    merchant = merchant,
                    amount = amountRial,
                    callbackUrl = callbackUrl,
                    orderId = order.Id.ToString(),
                    description = $"خرید اشتراک کایزر - سفارش #{order.Id}"
                };

                var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
                var response = await client.PostAsync("https://gateway.zibal.ir/v1/request", content);

                if (response.IsSuccessStatusCode)
                {
                    var resStr = await response.Content.ReadAsStringAsync();
                    var node = JsonNode.Parse(resStr);
                    int result = node?["result"]?.GetValue<int>() ?? -1;
                    long trackId = node?["trackId"]?.GetValue<long>() ?? 0;

                    if (result == 100 && trackId > 0)
                    {
                        string startUrl = $"https://gateway.zibal.ir/start/{trackId}";
                        return (true, startUrl, "هدایت به درگاه پرداخت");
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error requesting Zibal payment for order {OrderId}", orderId);
            }

            return (false, string.Empty, "خطا در برقراری ارتباط با درگاه پرداخت زیبال.");
        }

        public async Task<(bool Success, string Message, long OrderId)> VerifyZibalPaymentAsync(string trackId, string status)
        {
            if (status != "2")
            {
                return (false, "تراکنش توسط کاربر لغو شد یا ناموفق بود.", 0);
            }

            try
            {
                var client = _httpClientFactory.CreateClient();
                var payload = new
                {
                    merchant = "zibal",
                    trackId = trackId
                };

                var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
                var response = await client.PostAsync("https://gateway.zibal.ir/v1/verify", content);

                if (response.IsSuccessStatusCode)
                {
                    var resStr = await response.Content.ReadAsStringAsync();
                    var node = JsonNode.Parse(resStr);
                    int result = node?["result"]?.GetValue<int>() ?? -1;
                    string orderIdStr = node?["orderId"]?.GetValue<string>() ?? "0";
                    long.TryParse(orderIdStr, out long orderId);

                    if ((result == 100 || result == 201) && orderId > 0)
                    {
                        var order = await _db.Orders.FirstOrDefaultAsync(o => o.Id == orderId);
                        if (order != null && order.State == 0)
                        {
                            order.State = 1;
                            await _db.SaveChangesAsync();

                            // Issue service automatically
                            var setting = await _db.Settings.FirstOrDefaultAsync();
                            string baseUrl = setting?.SubDomain != null ? $"https://{setting.SubDomain}" : "https://sub.kaiser-cdn.com";
                            await _subscriptionService.IssueServiceAsync(order.Id, baseUrl);
                        }

                        return (true, "پرداخت با موفقیت انجام و اشتراک شما فعال گردید.", orderId);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error verifying Zibal trackId {TrackId}", trackId);
            }

            return (false, "تراکنش تایید نشد یا خطایی رخ داد.", 0);
        }
    }
}

namespace Kaiser.Backend.Models
{
    public class LoginRequest
    {
        public string Username { get; set; } = "";
        public string Password { get; set; } = "";
    }

    public class LoginResponse
    {
        public bool Success { get; set; }
        public string Token { get; set; } = "";
        public string Username { get; set; } = "";
        public string Role { get; set; } = "SuperAdmin";
        public string Message { get; set; } = "";
    }

    public class DashboardStatsDTO
    {
        public long TotalUsers { get; set; }
        public long ActiveServices { get; set; }
        public long TotalServers { get; set; }
        public long OnlineServers { get; set; }
        public long TotalOrders { get; set; }
        public long TotalRevenue { get; set; }
        public long ActiveDiscounts { get; set; }
        public long PendingTickets { get; set; }
        public List<DailySalesDTO> SalesChart { get; set; } = new();
        public List<ServerTrafficDTO> TrafficChart { get; set; } = new();
        public List<RecentServiceDTO> RecentServices { get; set; } = new();
    }

    public class DailySalesDTO
    {
        public string Date { get; set; } = "";
        public long Amount { get; set; }
    }

    public class ServerTrafficDTO
    {
        public string ServerName { get; set; } = "";
        public long TrafficBytes { get; set; }
        public double Percentage { get; set; }
    }

    public class RecentServiceDTO
    {
        public long Id { get; set; }
        public long UserId { get; set; }
        public string Email { get; set; } = "";
        public string PlanName { get; set; } = "";
        public long TotalUsed { get; set; }
        public long TotalLimit { get; set; }
        public long EndDate { get; set; }
        public long State { get; set; }
        public string Token { get; set; } = "";
    }

    public class CreateServerRequest
    {
        public string Name { get; set; } = "";
        public string Url { get; set; } = "";
        public string User { get; set; } = "";
        public string Password { get; set; } = "";
        public string PanelType { get; set; } = "sanaei";
        public string Domain { get; set; } = "";
        public long InboundId { get; set; }
        public long CatId { get; set; }
    }

    public class TestServerPingResponse
    {
        public bool Success { get; set; }
        public long PingMs { get; set; }
        public string Message { get; set; } = "";
        public int InboundsCount { get; set; }
    }

    public class CreatePlanRequest
    {
        public string PlanName { get; set; } = "";
        public string Description { get; set; } = "";
        public int MonthCount { get; set; } = 1;
        public long Price { get; set; }
        public long VolumeGB { get; set; }
        public long CatId { get; set; }
        public int UserLimit { get; set; } = 1;
        public int SpeedLimit { get; set; } = 0;
    }

    public class CreateCategoryRequest
    {
        public string Title { get; set; } = "";
        public long Parent { get; set; } = 0;
        public int Show { get; set; } = 1;
        public string TypeServices { get; set; } = "sub";
    }

    public class CreateOrderRequest
    {
        public long UserId { get; set; }
        public long PlanId { get; set; }
        public string Type { get; set; } = "sub";
        public long ServerId { get; set; } = 0;
        public long CatId { get; set; } = 0;
        public string? DiscountCode { get; set; }
        public long PhoneNumber { get; set; } = 0;
    }

    public class CreateOrderResponse
    {
        public bool Success { get; set; }
        public long OrderId { get; set; }
        public long FinalPrice { get; set; }
        public string Message { get; set; } = "";
        public string PaymentUrl { get; set; } = "";
    }

    public class IssueServiceResult
    {
        public bool Success { get; set; }
        public long ServiceId { get; set; }
        public string Token { get; set; } = "";
        public string SubUrl { get; set; } = "";
        public List<string> ConfigUrls { get; set; } = new();
        public string Message { get; set; } = "";
    }

    public class UpdateWalletRequest
    {
        public long UserId { get; set; }
        public long Amount { get; set; }
        public string Reason { get; set; } = "";
    }

    public class ReplyTicketRequest
    {
        public long TicketId { get; set; }
        public string ReplyText { get; set; } = "";
    }

    public class SubscriptionStatusDTO
    {
        public long ServiceId { get; set; }
        public string Email { get; set; } = "";
        public string PlanName { get; set; } = "";
        public long UsedBytes { get; set; }
        public long TotalBytes { get; set; }
        public double UsedPercent { get; set; }
        public long DaysRemaining { get; set; }
        public long ExpireTimestamp { get; set; }
        public long State { get; set; }
        public string StatusText { get; set; } = "";
        public string SubLink { get; set; } = "";
        public List<string> Configs { get; set; } = new();
    }
}

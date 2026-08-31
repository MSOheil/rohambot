using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Kaiser.Backend.Models
{
    [Table("AdminAccounts")]
    public class AdminAccount
    {
        [Key]
        public long Id { get; set; }
        public string Username { get; set; } = "admin";
        public string PasswordHash { get; set; } = "";
        public string Role { get; set; } = "SuperAdmin";
        public long CreatedAt { get; set; }
        public long LastLogin { get; set; }
    }

    [Table("Server")]
    public class Server
    {
        [Key]
        public long Id { get; set; }
        public string? User { get; set; }
        public string? Password { get; set; }
        public string? Url { get; set; }
        public string? PanelType { get; set; } = "sanaei";
        public string? Domain { get; set; }
        public string? Name { get; set; }
        public long State { get; set; } = 1;
        public string? Session { get; set; }
        public long CatId { get; set; }
        public long InboundId { get; set; }
        public string? DataConfigs { get; set; }
        public long SendBackUp { get; set; } = 0;
        public long Connection { get; set; } = 1;
        public long? DateConnectionLost { get; set; } = 0;
        public string? Onlines { get; set; }
    }

    [Table("category")]
    public class Category
    {
        [Key]
        public long Id { get; set; }
        public string? Title { get; set; }
        public long Parent { get; set; } = 0;
        public long Show { get; set; } = 1;
        public string? TypeServices { get; set; } = "sub";
    }

    [Table("ServerPlans")]
    public class ServerPlan
    {
        [Key]
        public long Id { get; set; }
        public string? PlanName { get; set; }
        public string? Description { get; set; }
        public long MonthCount { get; set; } = 1;
        public long Price { get; set; } = 0;
        public long Volume { get; set; } = 0;
        public long CatId { get; set; } = 0;
        public long CountSell { get; set; } = 0;
        public long SpeedLimit { get; set; } = 0;
        public long UserLimit { get; set; } = 1;
        public long PlanServerId { get; set; } = 0;
        public string? DataServer { get; set; }
        public long ContSold { get; set; } = 0;
    }

    [Table("PlanCat")]
    public class PlanCat
    {
        [Key]
        public long Id { get; set; }
        public long CatId { get; set; }
        public long PlanId { get; set; }
    }

    [Table("ServerCat")]
    public class ServerCat
    {
        [Key]
        public long Id { get; set; }
        public long ServerId { get; set; }
        public long CatId { get; set; }
    }

    [Table("Users")]
    public class User
    {
        [Key]
        public long Id { get; set; }
        public long UserId { get; set; }
        public string? UserName { get; set; }
        public long IsAdmin { get; set; } = 0;
        public long IsBlock { get; set; } = 0;
        public string? Name { get; set; }
        public string? Email { get; set; }
        public long Wallet { get; set; } = 0;
        public long UseFreeTrial { get; set; } = 0;
        public long ReqUnblock { get; set; } = 0;
        public long CountShopped { get; set; } = 0;
        public long Invited { get; set; } = 0;
        public string? InviteCode { get; set; }
        public long InvitedFrom { get; set; } = 0;
        public long CooperationId { get; set; } = 0;
        public long TimeJoin { get; set; } = 0;
        public string? STEP { get; set; } = "start";
        public long PhoneNumber { get; set; } = 0;
        public long ActiveCode { get; set; } = 0;
        public long IsActivePhone { get; set; } = 0;
    }

    [Table("Service")]
    public class Service
    {
        [Key]
        public long Id { get; set; }
        public long UserId { get; set; }
        public string? ConfigURL { get; set; }
        public string? Email { get; set; }
        public string? Password { get; set; }
        public string? LastData { get; set; }
        public long CreateDate { get; set; }
        public long EndDate { get; set; }
        public string? Token { get; set; }
        public string? authorization { get; set; }
        public long PlanId { get; set; }
        public long OrderId { get; set; }
        public long Upload { get; set; } = 0;
        public long Download { get; set; } = 0;
        public long TotalUsed { get; set; } = 0;
        public long CatId { get; set; }
        public long State { get; set; } = 1;
        public string? ServerIds { get; set; }
        public long TransformEnable { get; set; } = 0;
        public long AlertTimeFirst { get; set; } = 0;
        public long AlertTimeTwo { get; set; } = 0;
        public long AlertVolumeFirst { get; set; } = 0;
        public long AlertVolumeTwo { get; set; } = 0;
        public long RandomId { get; set; }
        public string? TypeService { get; set; } = "sub";
        public long isDelete { get; set; } = 0;
        public string? ServiceTest { get; set; }
        public long PhoneNumber { get; set; } = 0;
        public long UserLimit { get; set; } = 1;
        public long Warning { get; set; } = 0;
    }

    [Table("Configs")]
    public class Config
    {
        [Key]
        public long Id { get; set; }
        public long ServiceId { get; set; }
        public string? Name { get; set; }
        public string? uuid { get; set; }
        public long Upload { get; set; } = 0;
        public long Download { get; set; } = 0;
        public long TotalUsed { get; set; } = 0;
        public long TansformEnable { get; set; } = 0;
        public long ServerId { get; set; }
        public long State { get; set; } = 1;
        public long isDelete { get; set; } = 0;
        public long EndDate { get; set; }
        public long CreateDate { get; set; }
    }

    [Table("OrdersList")]
    public class Order
    {
        [Key]
        public long Id { get; set; }
        public long DateTime { get; set; }
        public long PlanId { get; set; }
        public long UserId { get; set; }
        public string? Type { get; set; } = "sub";
        public long State { get; set; } = 0;
        public long Price { get; set; } = 0;
        public long EndTimePlan { get; set; }
        public long DiscountId { get; set; } = 0;
        public long PriceAfterDiscount { get; set; } = 0;
        public long ServerId { get; set; } = 0;
        public long CatId { get; set; } = 0;
        public long PhoneNumber { get; set; } = 0;
    }

    [Table("Discounts")]
    public class Discount
    {
        [Key]
        public long Id { get; set; }
        public long Percent { get; set; }
        public string? DiscountCode { get; set; }
        public long Count { get; set; }
        public long DateEnd { get; set; }
        public long DateStart { get; set; }
        public long CanUse { get; set; } = 1;
        public long Status { get; set; } = 1;
    }

    [Table("DiscountUser")]
    public class DiscountUser
    {
        [Key]
        public long Id { get; set; }
        public long UserId { get; set; }
        public long DiscountId { get; set; }
    }

    [Table("Tikets")]
    public class Ticket
    {
        [Key]
        public long Id { get; set; }
        public string? Description { get; set; }
        public long UserId { get; set; }
        public long Answer { get; set; } = 0;
        public string? AdminReply { get; set; }
    }

    [Table("AppSuggestment")]
    public class AppSuggestment
    {
        [Key]
        public long Id { get; set; }
        public string? Name { get; set; }
        public string? URL { get; set; }
        public string? Description { get; set; }
        public string? appType { get; set; } = "Android";
        public string? Photo { get; set; } = "empty";
    }

    [Table("Setting")]
    public class Setting
    {
        [Key]
        [Column("rowid")]
        public long Id { get; set; } = 1;
        public long Status { get; set; } = 1;
        public string? LockChanel { get; set; }
        public long CardToCard { get; set; } = 1;
        public long OnlinePayment { get; set; } = 1;
        public string? BtnBot { get; set; } = "{\"btnshop\": \"on\", \"freetest\": \"on\", \"myacc\": \"on\", \"mysub\": \"on\", \"hamkarbtn\": \"on\", \"tamdidbtn\": \"on\", \"configdata\": \"on\", \"free\": \"on\"}";
        public long Wallet { get; set; } = 1;
        public long TimeSendBackUp { get; set; } = 0;
        public long TimeSendQuartz { get; set; } = 0;
        public long Shop { get; set; } = 1;
        public long Test { get; set; } = 1;
        public string? QuartzChanell { get; set; }
        public long CardToCardAutomatically { get; set; } = 0;
        public string? CardAdminNumber { get; set; }
        public string? CardAdminName { get; set; }
        public long LotteryTime { get; set; } = 0;
        public long LotteryState { get; set; } = 0;
        public long LotteryTimeAfter { get; set; } = 0;
        public long UserNumberLottery { get; set; } = 0;
        public long LotteryPlan { get; set; } = 0;
        public long Discount { get; set; } = 1;
        public long RewardInvite { get; set; } = 10;
        public string? SubDomain { get; set; } = "sub.kaiser-cdn.com";
        public long TimeAfterSendBackUp { get; set; } = 0;
        public long TimeAfterSendQuartz { get; set; } = 0;
        public long SendAlertVolumeFirst { get; set; } = 1;
        public long SendAlertVolumeTwo { get; set; } = 1;
        public long SendAlertTimeFirst { get; set; } = 1;
        public long SendAlertTimeTwo { get; set; } = 1;
        public long SendPhotoWithStartBot { get; set; } = 0;
        public long StartAfterUse { get; set; } = 0;
        public string? PhotoStart { get; set; }
        public string? PaymentGateway { get; set; } = "zibal";
        public long madpal { get; set; } = 0;
        public string? TokenMadPal { get; set; }
        public string? AlertCard { get; set; }
        public string? AlertOnline { get; set; }
        public string? UserBot { get; set; } = "KaiserRobot";
        public long SubShop { get; set; } = 1;
        public long SingleShop { get; set; } = 1;
        public string? MessageSub { get; set; }
        public string? MessageSingle { get; set; }
        public long SubSingle { get; set; } = 1;
        public string? ChanelQuartzQuartz { get; set; }
        public long OnlineXG { get; set; } = 0;
        public long alertTimeOut { get; set; } = 1;
        public long buyagain { get; set; } = 1;
        public long changelink { get; set; } = 1;
        public string? TestName { get; set; } = "KaiserTest";
        public string? SubName { get; set; } = "👑 Kaiser VIP";
        public string? SingleName { get; set; } = "👑 Kaiser Single";
        public long chanelLock { get; set; } = 0;
        public long InviteNeed { get; set; } = 0;
        [Column("SuppourtId ")]
        public string? SuppourtId { get; set; }
        public string? AdminTelegramId { get; set; } = "123456789";
        public string? SafeMode { get; set; }
        public long SafeModCat { get; set; } = 0;
    }

    [Table("imperfect")]
    public class Imperfect
    {
        [Key]
        public long Id { get; set; }
        public string? Type { get; set; }
        public long IsCompleted { get; set; } = 0;
        public long ConfigId { get; set; }
        public long ServiceId { get; set; }
        public long Volume { get; set; }
        public long EndDate { get; set; }
        public long CreateDate { get; set; }
        public string? uuid { get; set; }
        public long UserId { get; set; }
        public long DateCreateImperfect { get; set; }
        public long ServerId { get; set; }
    }

    [Table("TestFree")]
    public class TestFree
    {
        [Key]
        public long Id { get; set; }
        public long Volume { get; set; } = 1;
        public long Days { get; set; } = 1;
        public long CountGet { get; set; } = 0;
        public long ServerId { get; set; }
        public long GroupId { get; set; } = 0;
        public long Geted { get; set; } = 0;
    }

    [Table("PlanExtension")]
    public class PlanExtension
    {
        [Key]
        public long Id { get; set; }
        public string? Name { get; set; }
        public long Price { get; set; }
        public long Volume { get; set; }
        public long MonthCount { get; set; }
    }

    [Table("CooperationDiscount")]
    public class CooperationDiscount
    {
        [Key]
        public long Id { get; set; }
        public long Percent { get; set; }
        public long Count { get; set; }
    }

    [Table("PublicMessage")]
    public class PublicMessage
    {
        [Key]
        public long Id { get; set; }
        public string? Title { get; set; }
        public string? Description { get; set; }
        public int CountSended { get; set; } = 0;
        public int IsSended { get; set; } = 0;
        public int IsDelete { get; set; } = 0;
        public long AddUser { get; set; }
        public string? photo { get; set; } = "empty";
    }
}

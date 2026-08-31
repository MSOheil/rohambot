using Microsoft.EntityFrameworkCore;
using Kaiser.Backend.Controllers;
using Kaiser.Backend.Models;

namespace Kaiser.Backend.Data
{
    public static class DbInitializer
    {
        public static void Initialize(AppDbContext context)
        {
            // Ensure table creation for AdminAccounts
            try
            {
                if (context.Database.IsSqlite())
                {
                    context.Database.ExecuteSqlRaw(@"
                        CREATE TABLE IF NOT EXISTS AdminAccounts (
                            Id INTEGER PRIMARY KEY AUTOINCREMENT,
                            Username TEXT NOT NULL,
                            PasswordHash TEXT NOT NULL,
                            Role TEXT NOT NULL,
                            CreatedAt INTEGER NOT NULL,
                            LastLogin INTEGER NOT NULL
                        );
                    ");
                }
                else
                {
                    context.Database.EnsureCreated();
                }
            }
            catch { }

            // Seed Super Admin account (admin / kjhgfdsaMn01@)
            try
            {
                var admin = context.AdminAccounts.FirstOrDefault(a => a.Username == "admin");
                if (admin == null)
                {
                    context.AdminAccounts.Add(new AdminAccount
                    {
                        Username = "admin",
                        PasswordHash = AuthController.HashPassword("kjhgfdsaMn01@"),
                        Role = "SuperAdmin",
                        CreatedAt = DateTimeOffset.UtcNow.ToUnixTimeSeconds()
                    });
                    context.SaveChanges();
                }
            }
            catch { }

            // Seed default settings if not exists
            try
            {
                if (!context.Settings.Any())
                {
                    context.Settings.Add(new Setting
                    {
                        Id = 1,
                        Status = 1,
                        LockChanel = "namahdoodnet",
                        CardToCard = 1,
                        OnlinePayment = 1,
                        Wallet = 1,
                        Shop = 1,
                        Test = 1,
                        CardAdminNumber = "6037-9918-7261-5490",
                        CardAdminName = "مدیریت کایزر - بانک ملی",
                        Discount = 1,
                        SubDomain = "sub.kaiser-cdn.com",
                        PaymentGateway = "zibal",
                        AlertCard = "لطفا پس از واریز، تصویر فیش را ارسال نمایید. در کمتر از ۵ دقیقه تایید می‌شود.",
                        AlertOnline = "تحویل آنی بلافاصله پس از پرداخت اینترنتی موفق",
                        UserBot = "KaiserVpnRobot",
                        SubShop = 1,
                        SingleShop = 1,
                        TestName = "KaiserTest",
                        SubName = "👑 Kaiser VIP",
                        SingleName = "👑 Kaiser Single",
                        RewardInvite = 10
                    });
                    context.SaveChanges();
                }
            }
            catch { }

            // Seed default admin telegram user
            try
            {
                if (!context.Users.Any(u => u.UserId == 123456789))
                {
                    context.Users.Add(new User
                    {
                        UserId = 123456789,
                        UserName = "kaiser_admin",
                        Name = "Admin",
                        IsAdmin = 1,
                        Wallet = 1000000,
                        TimeJoin = DateTimeOffset.UtcNow.ToUnixTimeSeconds()
                    });
                    context.SaveChanges();
                }
            }
            catch { }
        }
    }
}

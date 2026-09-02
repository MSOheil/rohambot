using Microsoft.EntityFrameworkCore;
using Kaiser.Backend.Controllers;
using Kaiser.Backend.Models;
using Kaiser.Backend.Services;

namespace Kaiser.Backend.Data
{
    public static class DbInitializer
    {
        public static void Initialize(AppDbContext context)
        {
            var isPostgres = context.Database.IsNpgsql();
            var dbProvider = isPostgres ? "PostgreSQL" : "SQLite";

            KaiserLogger.Database($"Checking database connection ({dbProvider})...");

            // 1. Ensure Table Schema Creation
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

                    try
                    {
                        context.Database.ExecuteSqlRaw("ALTER TABLE Setting ADD COLUMN AdminTelegramId TEXT;");
                    }
                    catch { }

                    try
                    {
                        context.Database.ExecuteSqlRaw("ALTER TABLE Setting ADD COLUMN NightMessageEnabled INTEGER DEFAULT 1;");
                    }
                    catch { }

                    try
                    {
                        context.Database.ExecuteSqlRaw("ALTER TABLE Setting ADD COLUMN NightMessageTime TEXT DEFAULT '23:00';");
                    }
                    catch { }

                    try
                    {
                        context.Database.ExecuteSqlRaw("ALTER TABLE Setting ADD COLUMN NightMessageText TEXT;");
                    }
                    catch { }

                    try
                    {
                        context.Database.ExecuteSqlRaw("ALTER TABLE Setting ADD COLUMN WelcomeMessage TEXT;");
                    }
                    catch { }
                }
                else
                {
                    context.Database.EnsureCreated();
                    try
                    {
                        context.Database.ExecuteSqlRaw(@"ALTER TABLE ""Setting"" ADD COLUMN IF NOT EXISTS ""AdminTelegramId"" text;");
                    }
                    catch { }

                    try
                    {
                        context.Database.ExecuteSqlRaw(@"ALTER TABLE ""Setting"" ADD COLUMN IF NOT EXISTS ""NightMessageEnabled"" bigint DEFAULT 1;");
                    }
                    catch { }

                    try
                    {
                        context.Database.ExecuteSqlRaw(@"ALTER TABLE ""Setting"" ADD COLUMN IF NOT EXISTS ""NightMessageTime"" text DEFAULT '23:00';");
                    }
                    catch { }

                    try
                    {
                        context.Database.ExecuteSqlRaw(@"ALTER TABLE ""Setting"" ADD COLUMN IF NOT EXISTS ""NightMessageText"" text;");
                    }
                    catch { }

                    try
                    {
                        context.Database.ExecuteSqlRaw(@"ALTER TABLE ""Setting"" ADD COLUMN IF NOT EXISTS ""WelcomeMessage"" text;");
                    }
                    catch { }
                }
                KaiserLogger.Database($"✅ Database connection established and tables verified ({dbProvider})", new { provider = dbProvider });
            }
            catch (Exception ex)
            {
                KaiserLogger.Database($"❌ Database schema initialization failed on {dbProvider}: {ex.Message}", new { error = ex.Message }, false);
            }

            // 2. Seed Super Admin account (Username: roham / Password: kjhgfdsaMn01@)
            try
            {
                var oldAdmin = context.AdminAccounts.FirstOrDefault(a => a.Username == "admin");
                if (oldAdmin != null)
                {
                    context.AdminAccounts.Remove(oldAdmin);
                    context.SaveChanges();
                }

                var rohamAdmin = context.AdminAccounts.FirstOrDefault(a => a.Username == "roham");
                if (rohamAdmin == null)
                {
                    context.AdminAccounts.Add(new AdminAccount
                    {
                        Username = "roham",
                        PasswordHash = AuthController.HashPassword("kjhgfdsaMn01@"),
                        Role = "SuperAdmin",
                        CreatedAt = DateTimeOffset.UtcNow.ToUnixTimeSeconds()
                    });
                    context.SaveChanges();
                    KaiserLogger.Success("SuperAdmin account seeded successfully (Username: roham)", null, "AUTH");
                }
                else
                {
                    rohamAdmin.PasswordHash = AuthController.HashPassword("kjhgfdsaMn01@");
                    rohamAdmin.Role = "SuperAdmin";
                    context.SaveChanges();
                    KaiserLogger.Info("SuperAdmin account verified (Username: roham)", null, "AUTH");
                }
            }
            catch (Exception ex)
            {
                KaiserLogger.Error("Error checking SuperAdmin account", ex, "AUTH");
            }

            // 3. Seed default settings if not exists
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
                    KaiserLogger.Success("Default system settings seeded successfully", null, "SETTINGS");
                }
                else
                {
                    var existing = context.Settings.FirstOrDefault();
                    if (existing != null && string.IsNullOrEmpty(existing.NightMessageText))
                    {
                        existing.NightMessageText = "🌙 شب شما بخیر و آرامش!\n\n✨ با تشکر از همراهی شما با نامحدود نت. تمامی سرورها و کانفیگ‌ها پایدار و با سرعت بالا در دسترس شما هستند.\n\nشبتون پر از آرامش 💫";
                        existing.NightMessageTime = existing.NightMessageTime ?? "23:00";
                        existing.NightMessageEnabled = 1;
                        context.SaveChanges();
                    }

                    if (existing != null && string.IsNullOrEmpty(existing.WelcomeMessage))
                    {
                        existing.WelcomeMessage = "به ربات   «نامحدود نت»   خوش آمدید.\n\n\n⚡️ارائه پر سرعت و نامحدود اشتراک های V2ray برای استفاده \nشخصی و مولتی لوکیشن open vpn \n🇩🇪🇳🇱🇯🇴🇹🇷\nمخصوص گیم، ترید ،فیلم سرعت 🛜بسیار بالاتر و پینگ پایین.\n⏱️تحویل آنی و قابلیت مدیریت هوشمند سابسکریبشن\n\nلطفا از منوی زیر  گزینه مورد نظر خود را انتخاب کنید👇👇👇";
                        context.SaveChanges();
                    }
                    KaiserLogger.Info("Default system settings verified", null, "SETTINGS");
                }
            }
            catch (Exception ex)
            {
                KaiserLogger.Error("Error initializing default settings", ex, "SETTINGS");
            }

            // 4. Seed default admin telegram users and clean up dummy admin
            try
            {
                var dummyAdmin = context.Users.FirstOrDefault(u => u.UserId == 123456789 || u.UserName == "kaiser_admin");
                if (dummyAdmin != null)
                {
                    context.Users.Remove(dummyAdmin);
                    context.SaveChanges();
                    KaiserLogger.Success("Legacy dummy admin user removed (123456789 / kaiser_admin)", null, "DATABASE");
                }

                var adminIds = new long[] { 8793231252, 8429466517 };
                foreach (var aid in adminIds)
                {
                    if (!context.Users.Any(u => u.UserId == aid))
                    {
                        context.Users.Add(new User
                        {
                            UserId = aid,
                            UserName = $"kaiser_admin_{aid}",
                            Name = "SuperAdmin",
                            IsAdmin = 1,
                            Wallet = 1000000,
                            TimeJoin = DateTimeOffset.UtcNow.ToUnixTimeSeconds()
                        });
                    }
                }
                context.SaveChanges();
                KaiserLogger.Success("Default admin telegram users verified (IDs: 8793231252, 8429466517)", null, "DATABASE");
            }
            catch (Exception ex)
            {
                KaiserLogger.Error("Error seeding default admin user", ex, "DATABASE");
            }
        }
    }
}

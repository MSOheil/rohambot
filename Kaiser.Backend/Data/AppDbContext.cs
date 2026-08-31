using Microsoft.EntityFrameworkCore;
using Kaiser.Backend.Models;

namespace Kaiser.Backend.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<AdminAccount> AdminAccounts => Set<AdminAccount>();
        public DbSet<Server> Servers => Set<Server>();
        public DbSet<Category> Categories => Set<Category>();
        public DbSet<ServerPlan> ServerPlans => Set<ServerPlan>();
        public DbSet<PlanCat> PlanCats => Set<PlanCat>();
        public DbSet<ServerCat> ServerCats => Set<ServerCat>();
        public DbSet<User> Users => Set<User>();
        public DbSet<Service> Services => Set<Service>();
        public DbSet<Config> Configs => Set<Config>();
        public DbSet<Order> Orders => Set<Order>();
        public DbSet<Discount> Discounts => Set<Discount>();
        public DbSet<DiscountUser> DiscountUsers => Set<DiscountUser>();
        public DbSet<Ticket> Tickets => Set<Ticket>();
        public DbSet<AppSuggestment> AppSuggestments => Set<AppSuggestment>();
        public DbSet<Setting> Settings => Set<Setting>();
        public DbSet<Imperfect> Imperfects => Set<Imperfect>();
        public DbSet<TestFree> TestFrees => Set<TestFree>();
        public DbSet<PlanExtension> PlanExtensions => Set<PlanExtension>();
        public DbSet<CooperationDiscount> CooperationDiscounts => Set<CooperationDiscount>();
        public DbSet<PublicMessage> PublicMessages => Set<PublicMessage>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<AdminAccount>().ToTable("AdminAccounts");
            modelBuilder.Entity<Setting>().HasKey(s => s.Id);
            modelBuilder.Entity<Category>().ToTable("category");
            modelBuilder.Entity<Order>().ToTable("OrdersList");
            modelBuilder.Entity<Ticket>().ToTable("Tikets");
            modelBuilder.Entity<Imperfect>().ToTable("imperfect");
        }
    }
}

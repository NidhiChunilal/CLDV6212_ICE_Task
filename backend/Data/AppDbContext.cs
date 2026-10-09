using System;
using LogisticsFleetTracker.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace LogisticsFleetTracker.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options)
    : DbContext(options)
{
    public DbSet<Driver> Drivers => Set<Driver>();

    public DbSet<Shipment> Shipments => Set<Shipment>();

    public DbSet<StatusLog> StatusLogs => Set<StatusLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Driver>(entity =>
        {
            entity.HasKey(d => d.Id);

            entity.Property(d => d.FullName)
                .HasMaxLength(120)
                .IsRequired();

            entity.Property(d => d.VehicleRegistration)
                .HasMaxLength(30)
                .IsRequired();

            entity.Property(d => d.PhoneNumber)
                .HasMaxLength(30)
                .IsRequired();
        });

        modelBuilder.Entity<Shipment>(entity =>
        {
            entity.HasKey(s => s.Id);

            entity.HasIndex(s => s.TrackingNumber)
                .IsUnique();

            entity.Property(s => s.TrackingNumber)
                .HasMaxLength(30)
                .IsRequired();

            entity.Property(s => s.SenderName)
                .HasMaxLength(120)
                .IsRequired();

            entity.Property(s => s.RecipientName)
                .HasMaxLength(120)
                .IsRequired();

            entity.Property(s => s.DestinationAddress)
                .HasMaxLength(300)
                .IsRequired();

            entity.Property(s => s.CurrentStatus)
                .HasMaxLength(40)
                .IsRequired();

            entity.Property(s => s.PackageWeightKg)
                .HasPrecision(10, 2);

            entity.HasOne(s => s.Driver)
                .WithMany(d => d.Shipments)
                .HasForeignKey(s => s.DriverId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<StatusLog>(entity =>
        {
            entity.HasKey(l => l.Id);

            entity.Property(l => l.Status)
                .HasMaxLength(40)
                .IsRequired();

            entity.Property(l => l.Notes)
                .HasMaxLength(500);

            entity.HasOne(l => l.Shipment)
                .WithMany(s => s.StatusLogs)
                .HasForeignKey(l => l.ShipmentId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
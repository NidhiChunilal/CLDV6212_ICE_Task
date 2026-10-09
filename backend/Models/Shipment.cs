using System;

namespace LogisticsFleetTracker.Api.Models;

public class Shipment
{
    public int Id { get; set; }

    public string TrackingNumber { get; set; } = string.Empty;

    public string SenderName { get; set; } = string.Empty;

    public string RecipientName { get; set; } = string.Empty;

    public string DestinationAddress { get; set; } = string.Empty;

    public decimal PackageWeightKg { get; set; }

    public string CurrentStatus { get; set; } = "Pending";

    public int? DriverId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Driver? Driver { get; set; }

    public ICollection<StatusLog> StatusLogs { get; set; } = new List<StatusLog>();
}
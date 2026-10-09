using System;

using LogisticsFleetTracker.Api.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LogisticsFleetTracker.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DriversController : ControllerBase
{
    private readonly AppDbContext _db;

    public DriversController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetDrivers()
    {
        var drivers = await _db.Drivers
            .OrderBy(d => d.FullName)
            .ToListAsync();

        return Ok(drivers);
    }

    [HttpGet("{id}/shipments")]
    public async Task<IActionResult> GetDriverShipments(int id)
    {
        var shipments = await _db.Shipments
            .Where(s => s.DriverId == id)
            .Include(s => s.Driver)
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync();

        return Ok(shipments);
    }
}

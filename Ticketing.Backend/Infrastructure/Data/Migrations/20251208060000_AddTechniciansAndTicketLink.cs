using System;
using Microsoft.EntityFrameworkCore.Migrations;

namespace Ticketing.Backend.Infrastructure.Data.Migrations;

public partial class AddTechniciansAndTicketLink : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "Technicians",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "TEXT", nullable: false),
                FullName = table.Column<string>(type: "TEXT", nullable: false),
                Email = table.Column<string>(type: "TEXT", nullable: false),
                Phone = table.Column<string>(type: "TEXT", nullable: true),
                Department = table.Column<string>(type: "TEXT", nullable: true),
                IsActive = table.Column<bool>(type: "INTEGER", nullable: false),
                CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                UserId = table.Column<Guid>(type: "TEXT", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_Technicians", x => x.Id);
                table.ForeignKey(
                    name: "FK_Technicians_Users_UserId",
                    column: x => x.UserId,
                    principalTable: "Users",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.SetNull);
            });

        migrationBuilder.CreateIndex(
            name: "IX_Technicians_UserId",
            table: "Technicians",
            column: "UserId");

        migrationBuilder.AddColumn<Guid>(
            name: "TechnicianId",
            table: "Tickets",
            type: "TEXT",
            nullable: true);

        migrationBuilder.CreateIndex(
            name: "IX_Tickets_TechnicianId",
            table: "Tickets",
            column: "TechnicianId");

        migrationBuilder.AddForeignKey(
            name: "FK_Tickets_Technicians_TechnicianId",
            table: "Tickets",
            column: "TechnicianId",
            principalTable: "Technicians",
            principalColumn: "Id",
            onDelete: ReferentialAction.SetNull);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropForeignKey(
            name: "FK_Tickets_Technicians_TechnicianId",
            table: "Tickets");

        migrationBuilder.DropIndex(
            name: "IX_Tickets_TechnicianId",
            table: "Tickets");

        migrationBuilder.DropColumn(
            name: "TechnicianId",
            table: "Tickets");

        migrationBuilder.DropTable(
            name: "Technicians");
    }
}

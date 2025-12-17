using System;
using Microsoft.EntityFrameworkCore;
using Ticketing.Backend.Application.DTOs;
using Ticketing.Backend.Domain.Entities;
using Ticketing.Backend.Infrastructure.Data;

namespace Ticketing.Backend.Application.Services;

public interface ICategoryService
{
    Task<IEnumerable<CategoryResponse>> GetAllAsync();
    Task<CategoryListResponse> GetAdminCategoriesAsync(string? search = null, int page = 1, int pageSize = 50);
    Task<CategoryResponse?> CreateAsync(CategoryRequest request, IEnumerable<SubcategoryRequest>? subcategories = null);
    Task<CategoryResponse?> UpdateAsync(int id, CategoryRequest request);
    Task<bool> DeleteAsync(int id);
    Task<IEnumerable<SubcategoryResponse>> GetSubcategoriesAsync(int categoryId);
    Task<SubcategoryResponse?> CreateSubcategoryAsync(int categoryId, SubcategoryRequest request);
    Task<SubcategoryResponse?> UpdateSubcategoryAsync(int id, SubcategoryRequest request);
    Task<bool> DeleteSubcategoryAsync(int id);
}

public class CategoryService : ICategoryService
{
    private readonly AppDbContext _context;

    public CategoryService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<CategoryResponse>> GetAllAsync()
    {
        // Public endpoint - only return active categories
        var categories = await _context.Categories
            .Include(c => c.Subcategories)
            .Where(c => c.IsActive)
            .ToListAsync();
        return categories.Select(c => new CategoryResponse
        {
            Id = c.Id,
            Name = c.Name,
            Description = c.Description,
            IsActive = c.IsActive,
            CreatedAt = c.CreatedAt,
            Subcategories = c.Subcategories
                .Where(s => s.IsActive)
                .Select(MapSubcategoryToResponse)
        });
    }

    public async Task<CategoryListResponse> GetAdminCategoriesAsync(string? search = null, int page = 1, int pageSize = 50)
    {
        var query = _context.Categories.Include(c => c.Subcategories).AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(c => c.Name.Contains(search) || (c.Description != null && c.Description.Contains(search)));
        }

        var totalCount = await query.CountAsync();
        var items = await query
            .OrderBy(c => c.Name)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new CategoryListResponse
        {
            Items = items.Select(MapToResponse),
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<CategoryResponse?> CreateAsync(CategoryRequest request, IEnumerable<SubcategoryRequest>? subcategories = null)
    {
        // Check for duplicate name
        var existing = await _context.Categories.FirstOrDefaultAsync(c => c.Name == request.Name);
        if (existing != null)
        {
            throw new InvalidOperationException($"Category with name '{request.Name}' already exists");
        }

        var category = new Category
        {
            Name = request.Name,
            Description = request.Description,
            IsActive = request.IsActive,
            CreatedAt = DateTime.UtcNow,
            Subcategories = subcategories?.Select(sc => new Subcategory 
            { 
                Name = sc.Name,
                Description = sc.Description,
                IsActive = sc.IsActive,
                CreatedAt = DateTime.UtcNow
            }).ToList() ?? new List<Subcategory>()
        };

        _context.Categories.Add(category);
        await _context.SaveChangesAsync();

        return MapToResponse(category);
    }

    public async Task<CategoryResponse?> UpdateAsync(int id, CategoryRequest request)
    {
        var category = await _context.Categories.Include(c => c.Subcategories).FirstOrDefaultAsync(c => c.Id == id);
        if (category == null)
        {
            return null;
        }

        // Check for duplicate name (excluding current category)
        var existing = await _context.Categories.FirstOrDefaultAsync(c => c.Name == request.Name && c.Id != id);
        if (existing != null)
        {
            throw new InvalidOperationException($"Category with name '{request.Name}' already exists");
        }

        category.Name = request.Name;
        category.Description = request.Description;
        category.IsActive = request.IsActive;
        await _context.SaveChangesAsync();
        return MapToResponse(category);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var category = await _context.Categories
            .Include(c => c.Tickets)
            .Include(c => c.Subcategories)
            .FirstOrDefaultAsync(c => c.Id == id);
        if (category == null)
        {
            return false;
        }

        // Check if category is used by tickets
        if (category.Tickets.Any())
        {
            throw new InvalidOperationException("Cannot delete category that is used by tickets. Consider deactivating it instead.");
        }

        // Check if category has subcategories
        if (category.Subcategories.Any())
        {
            throw new InvalidOperationException("Cannot delete category that has subcategories. Please delete subcategories first.");
        }

        _context.Categories.Remove(category);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<IEnumerable<SubcategoryResponse>> GetSubcategoriesAsync(int categoryId)
    {
        var subcategories = await _context.Subcategories
            .Where(s => s.CategoryId == categoryId)
            .OrderBy(s => s.Name)
            .ToListAsync();
        return subcategories.Select(MapSubcategoryToResponse);
    }

    public async Task<SubcategoryResponse?> CreateSubcategoryAsync(int categoryId, SubcategoryRequest request)
    {
        var category = await _context.Categories.FirstOrDefaultAsync(c => c.Id == categoryId);
        if (category == null)
        {
            return null;
        }

        // Check for duplicate name within the category
        var existing = await _context.Subcategories
            .FirstOrDefaultAsync(s => s.CategoryId == categoryId && s.Name == request.Name);
        if (existing != null)
        {
            throw new InvalidOperationException($"Subcategory with name '{request.Name}' already exists in this category");
        }

        var subcategory = new Subcategory
        {
            CategoryId = categoryId,
            Name = request.Name,
            Description = request.Description,
            IsActive = request.IsActive,
            CreatedAt = DateTime.UtcNow
        };

        _context.Subcategories.Add(subcategory);
        await _context.SaveChangesAsync();

        return MapSubcategoryToResponse(subcategory);
    }

    public async Task<SubcategoryResponse?> UpdateSubcategoryAsync(int id, SubcategoryRequest request)
    {
        var subcategory = await _context.Subcategories.FirstOrDefaultAsync(s => s.Id == id);
        if (subcategory == null)
        {
            return null;
        }

        // Check for duplicate name within the same category (excluding current subcategory)
        var existing = await _context.Subcategories
            .FirstOrDefaultAsync(s => s.CategoryId == subcategory.CategoryId && s.Name == request.Name && s.Id != id);
        if (existing != null)
        {
            throw new InvalidOperationException($"Subcategory with name '{request.Name}' already exists in this category");
        }

        subcategory.Name = request.Name;
        subcategory.Description = request.Description;
        subcategory.IsActive = request.IsActive;
        await _context.SaveChangesAsync();

        return MapSubcategoryToResponse(subcategory);
    }

    public async Task<bool> DeleteSubcategoryAsync(int id)
    {
        var subcategory = await _context.Subcategories
            .Include(s => s.Tickets)
            .FirstOrDefaultAsync(s => s.Id == id);
        if (subcategory == null)
        {
            return false;
        }

        // Check if subcategory is used by tickets
        if (subcategory.Tickets.Any())
        {
            throw new InvalidOperationException("Cannot delete subcategory that is used by tickets. Consider deactivating it instead.");
        }

        _context.Subcategories.Remove(subcategory);
        await _context.SaveChangesAsync();
        return true;
    }

    private static CategoryResponse MapToResponse(Category category) => new()
    {
        Id = category.Id,
        Name = category.Name,
        Description = category.Description,
        IsActive = category.IsActive,
        CreatedAt = category.CreatedAt,
        Subcategories = category.Subcategories.Select(MapSubcategoryToResponse)
    };

    private static SubcategoryResponse MapSubcategoryToResponse(Subcategory subcategory) => new()
    {
        Id = subcategory.Id,
        Name = subcategory.Name,
        Description = subcategory.Description,
        IsActive = subcategory.IsActive,
        CreatedAt = subcategory.CreatedAt
    };
}

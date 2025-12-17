"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import {
  Plus,
  Edit,
  Trash2,
  FolderPlus,
  Settings,
  AlertTriangle,
  Search,
  Loader2,
} from "lucide-react";
import type { FormFieldDef, FieldType } from "@/lib/dynamic-forms";
import { parseOptions } from "@/lib/dynamic-forms";
import {
  getAdminCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getSubcategories,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
} from "@/lib/categories-api";
import type {
  ApiCategoryResponse,
  ApiSubcategoryResponse,
} from "@/lib/api-types";

interface CategoryManagementProps {
  categoriesData?: any;
  onCategoryUpdate?: (updatedCategories: any) => void;
}

export function CategoryManagement({
  categoriesData: _legacyCategoriesData,
  onCategoryUpdate: _legacyOnCategoryUpdate,
}: CategoryManagementProps) {
  const { token } = useAuth();
  const [categories, setCategories] = useState<ApiCategoryResponse[]>([]);
  const [subcategories, setSubcategories] = useState<ApiSubcategoryResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [subcategoriesLoading, setSubcategoriesLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [editingCategory, setEditingCategory] = useState<ApiCategoryResponse | null>(null);
  const [editingSubCategory, setEditingSubCategory] = useState<ApiSubcategoryResponse | null>(null);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [subCategoryDialogOpen, setSubCategoryDialogOpen] = useState(false);
  const [newCategoryData, setNewCategoryData] = useState({
    name: "",
    description: "",
    isActive: true,
  });
  const [newSubCategoryData, setNewSubCategoryData] = useState({
    name: "",
    description: "",
    isActive: true,
  });

  // Field designer state
  const [fieldDesignerOpen, setFieldDesignerOpen] = useState(false);
  const [designingSubId, setDesigningSubId] = useState<string | null>(null);
  const [editingFields, setEditingFields] = useState<FormFieldDef[]>([]);
  const [newField, setNewField] = useState<{
    id: string;
    label: string;
    type: FieldType;
    required: boolean;
    placeholder?: string;
    optionsText?: string;
  }>({
    id: "",
    label: "",
    type: "text",
    required: false,
    placeholder: "",
    optionsText: "",
  });

  // Load categories on mount and when search query changes
  useEffect(() => {
    if (token) {
      loadCategories();
    }
  }, [token, searchQuery]);

  // Load subcategories when category is selected
  useEffect(() => {
    if (token && selectedCategoryId) {
      loadSubcategories(selectedCategoryId);
    } else {
      setSubcategories([]);
    }
  }, [token, selectedCategoryId]);

  const loadCategories = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const result = await getAdminCategories(token, { search: searchQuery });
      setCategories(result.items);
    } catch (error: any) {
      console.error("Failed to load categories:", error);
      toast({
        title: "خطا در بارگذاری دسته‌بندی‌ها",
        description: error?.message || "لطفاً دوباره تلاش کنید",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSubcategories = async (categoryId: number) => {
    if (!token) return;
    setSubcategoriesLoading(true);
    try {
      const subs = await getSubcategories(token, categoryId);
      setSubcategories(subs);
    } catch (error: any) {
      console.error("Failed to load subcategories:", error);
      toast({
        title: "خطا در بارگذاری زیر دسته‌ها",
        description: error?.message || "لطفاً دوباره تلاش کنید",
        variant: "destructive",
      });
    } finally {
      setSubcategoriesLoading(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!token || !newCategoryData.name.trim()) {
      toast({
        title: "خطا",
        description: "لطفاً نام دسته‌بندی را وارد کنید",
        variant: "destructive",
      });
      return;
    }

    try {
      await createCategory(token, newCategoryData);
      toast({
        title: "موفق",
        description: "دسته‌بندی جدید ایجاد شد",
      });
      setCategoryDialogOpen(false);
      setNewCategoryData({ name: "", description: "", isActive: true });
      await loadCategories();
    } catch (error: any) {
      console.error("Failed to create category:", error);
      toast({
        title: "خطا در ایجاد دسته‌بندی",
        description: error?.message || "لطفاً دوباره تلاش کنید",
        variant: "destructive",
      });
    }
  };

  const handleUpdateCategory = async () => {
    if (!token || !editingCategory || !editingCategory.name.trim()) {
      toast({
        title: "خطا",
        description: "لطفاً نام دسته‌بندی را وارد کنید",
        variant: "destructive",
      });
      return;
    }

    try {
      await updateCategory(token, editingCategory.id, {
        name: editingCategory.name,
        description: editingCategory.description || null,
        isActive: editingCategory.isActive,
      });
      toast({ title: "موفق", description: "دسته‌بندی به‌روزرسانی شد" });
      setEditingCategory(null);
      await loadCategories();
      if (selectedCategoryId === editingCategory.id) {
        await loadSubcategories(editingCategory.id);
      }
    } catch (error: any) {
      console.error("Failed to update category:", error);
      toast({
        title: "خطا در به‌روزرسانی دسته‌بندی",
        description: error?.message || "لطفاً دوباره تلاش کنید",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCategory = async (categoryId: number) => {
    if (!token) return;
    if (!confirm("آیا از حذف این دسته‌بندی اطمینان دارید؟")) return;

    try {
      await deleteCategory(token, categoryId);
      toast({
        title: "موفق",
        description: "دسته‌بندی حذف شد",
      });
      if (selectedCategoryId === categoryId) {
        setSelectedCategoryId(null);
      }
      await loadCategories();
    } catch (error: any) {
      console.error("Failed to delete category:", error);
      toast({
        title: "خطا در حذف دسته‌بندی",
        description: error?.message || "این دسته‌بندی در حال استفاده است و نمی‌توان آن را حذف کرد",
        variant: "destructive",
      });
    }
  };

  const handleCreateSubCategory = async () => {
    if (!token || !selectedCategoryId || !newSubCategoryData.name.trim()) {
      toast({
        title: "خطا",
        description: "لطفاً نام زیر دسته را وارد کنید",
        variant: "destructive",
      });
      return;
    }

    try {
      await createSubcategory(token, selectedCategoryId, newSubCategoryData);
      toast({
        title: "موفق",
        description: "زیر دسته جدید ایجاد شد",
      });
      setSubCategoryDialogOpen(false);
      setNewSubCategoryData({ name: "", description: "", isActive: true });
      await loadSubcategories(selectedCategoryId);
      await loadCategories();
    } catch (error: any) {
      console.error("Failed to create subcategory:", error);
      toast({
        title: "خطا در ایجاد زیر دسته",
        description: error?.message || "لطفاً دوباره تلاش کنید",
        variant: "destructive",
      });
    }
  };

  const handleUpdateSubCategory = async () => {
    if (!token || !editingSubCategory || !editingSubCategory.name.trim()) {
      toast({
        title: "خطا",
        description: "لطفاً نام زیر دسته را وارد کنید",
        variant: "destructive",
      });
      return;
    }

    try {
      await updateSubcategory(token, editingSubCategory.id, {
        name: editingSubCategory.name,
        description: editingSubCategory.description || null,
        isActive: editingSubCategory.isActive,
      });
      toast({ title: "موفق", description: "زیر دسته به‌روزرسانی شد" });
      setEditingSubCategory(null);
      if (selectedCategoryId) {
        await loadSubcategories(selectedCategoryId);
        await loadCategories();
      }
    } catch (error: any) {
      console.error("Failed to update subcategory:", error);
      toast({
        title: "خطا در به‌روزرسانی زیر دسته",
        description: error?.message || "لطفاً دوباره تلاش کنید",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSubCategory = async (subCategoryId: number) => {
    if (!token) return;
    if (!confirm("آیا از حذف این زیر دسته اطمینان دارید؟")) return;

    try {
      await deleteSubcategory(token, subCategoryId);
      toast({
        title: "موفق",
        description: "زیر دسته حذف شد",
      });
      if (selectedCategoryId) {
        await loadSubcategories(selectedCategoryId);
        await loadCategories();
      }
    } catch (error: any) {
      console.error("Failed to delete subcategory:", error);
      toast({
        title: "خطا در حذف زیر دسته",
        description: error?.message || "این زیر دسته در حال استفاده است و نمی‌توان آن را حذف کرد",
        variant: "destructive",
      });
    }
  };

  // Dynamic Field Designer handlers (preserved for future use)
  const openFieldDesigner = (subId: number) => {
    // Field designer functionality can be added later if needed
    toast({
      title: "اطلاع",
      description: "طراحی فیلدهای سفارشی در نسخه‌های بعدی اضافه خواهد شد",
    });
  };

  const saveFieldDesigner = () => {
    // Field designer functionality can be added later if needed
    setFieldDesignerOpen(false);
    setDesigningSubId(null);
  };

  const addNewField = () => {
    if (!newField.id || !newField.label) {
      toast({
        title: "خطا",
        description: "شناسه و عنوان فیلد الزامی است",
        variant: "destructive",
      });
      return;
    }
    if (editingFields.some((f) => f.id === newField.id)) {
      toast({
        title: "خطا",
        description: "شناسه فیلد تکراری است",
        variant: "destructive",
      });
      return;
    }
    const options =
      newField.type === "select" || newField.type === "radio"
        ? parseOptions(newField.optionsText || "")
        : [];
    const toAdd: FormFieldDef = {
      id: newField.id,
      label: newField.label,
      type: newField.type,
      required: newField.required,
      placeholder: newField.placeholder,
      options,
    };
    setEditingFields((prev) => [...prev, toAdd]);
    setNewField({
      id: "",
      label: "",
      type: "text",
      required: false,
      placeholder: "",
      optionsText: "",
    });
    toast({ title: "موفق", description: "فیلد اضافه شد" });
  };

  const updateField = (
    index: number,
    patch: Partial<FormFieldDef> & { optionsText?: string }
  ) => {
    setEditingFields((prev) => {
      const copy = [...prev];
      const existing = copy[index];
      let options = existing.options;
      if (patch.optionsText !== undefined) {
        options = parseOptions(patch.optionsText);
      }
      copy[index] = { ...existing, ...patch, options };
      return copy;
    });
  };

  const removeField = (index: number) => {
    setEditingFields((prev) => prev.filter((_, i) => i !== index));
  };

  // Default fields preview for built-in forms
  const getDefaultFieldDefs = (
    catId: string,
    subId?: string
  ): FormFieldDef[] => {
    switch (catId) {
      case "hardware": {
        if (subId === "computer-not-working") {
          return [
            {
              id: "deviceBrand",
              label: "برند دستگاه",
              type: "select",
              required: false,
              options: [],
            },
            {
              id: "deviceModel",
              label: "مدل دستگاه",
              type: "text",
              required: false,
            },
            {
              id: "powerStatus",
              label: "وضعیت روشن شدن",
              type: "select",
              required: false,
              options: [],
            },
          ];
        }
        return [
          {
            id: "deviceType",
            label: "نوع دستگاه",
            type: "select",
            required: true,
            options: [],
          },
          {
            id: "deviceModel",
            label: "مدل دستگاه",
            type: "text",
            required: true,
          },
          {
            id: "serialNumber",
            label: "سریال نامبر",
            type: "text",
            required: false,
          },
          {
            id: "warrantyStatus",
            label: "وضعیت گارانتی",
            type: "select",
            required: true,
            options: [],
          },
        ];
      }
      case "software": {
        if (subId === "os-issues") {
          return [
            {
              id: "operatingSystem",
              label: "سیستم‌عامل",
              type: "select",
              required: false,
              options: [],
            },
            {
              id: "version",
              label: "نسخه/بیلد",
              type: "text",
              required: false,
            },
          ];
        }
        return [
          {
            id: "softwareName",
            label: "نام نرم‌افزار",
            type: "text",
            required: true,
          },
          { id: "version", label: "نسخه", type: "text", required: false },
          {
            id: "licenseInfo",
            label: "اطلاعات لایسنس",
            type: "textarea",
            required: false,
          },
        ];
      }
      case "network": {
        if (subId === "internet-connection") {
          return [
            {
              id: "internetAccess",
              label: "دسترسی اینترنت",
              type: "select",
              required: false,
              options: [],
            },
            {
              id: "affectedServices",
              label: "سرویس‌های متاثر",
              type: "textarea",
              required: true,
            },
          ];
        }
        return [
          {
            id: "connectionType",
            label: "نوع اتصال",
            type: "select",
            required: true,
            options: [],
          },
          {
            id: "networkLocation",
            label: "محل شبکه/اتاق",
            type: "text",
            required: true,
          },
          { id: "ipAddress", label: "آدرس IP", type: "text", required: false },
        ];
      }
      case "email": {
        return [
          {
            id: "emailProvider",
            label: "سرویس‌دهنده ایمیل",
            type: "select",
            required: true,
            options: [],
          },
          {
            id: "emailClient",
            label: "کلاینت ایمیل",
            type: "select",
            required: false,
            options: [],
          },
        ];
      }
      case "security": {
        return [
          {
            id: "incidentType",
            label: "نوع رویداد امنیتی",
            type: "select",
            required: true,
            options: [],
          },
          {
            id: "affectedSystems",
            label: "سامانه‌های متاثر",
            type: "textarea",
            required: false,
          },
        ];
      }
      case "access": {
        return [
          { id: "system", label: "سامانه/سیستم", type: "text", required: true },
          {
            id: "requestedAccess",
            label: "دسترسی درخواستی",
            type: "textarea",
            required: true,
          },
        ];
      }
      case "training": {
        return [
          { id: "topic", label: "موضوع", type: "text", required: true },
          {
            id: "preferredTime",
            label: "زمان پیشنهادی",
            type: "datetime",
            required: false,
          },
        ];
      }
      case "maintenance": {
        return [
          { id: "asset", label: "دارایی/تجهیز", type: "text", required: true },
          {
            id: "maintenanceType",
            label: "نوع نگهداشت",
            type: "select",
            required: false,
            options: [],
          },
        ];
      }
      default:
        return [];
    }
  };

  const defaultPreview: FormFieldDef[] = [];

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <div className="text-right">
          <h3 className="text-xl font-bold font-iran">مدیریت دسته‌بندی‌ها</h3>
          <p className="text-muted-foreground font-iran">
            مدیریت دسته‌بندی‌ها و زیر دسته‌های تیکت‌ها
          </p>
        </div>
        <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 font-iran">
              <Plus className="w-4 h-4" />
              دسته‌بندی جدید
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md font-iran" dir="rtl">
            <DialogHeader>
              <DialogTitle className="text-right font-iran">
                ایجاد دسته‌بندی جدید
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="categoryName" className="text-right font-iran">
                  نام دسته‌بندی *
                </Label>
                <Input
                  id="categoryName"
                  placeholder="مثال: مشکلات سخت‌افزاری"
                  value={newCategoryData.name}
                  onChange={(e) =>
                    setNewCategoryData({
                      ...newCategoryData,
                      name: e.target.value,
                    })
                  }
                  className="text-right font-iran"
                  dir="rtl"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="categoryDescription"
                  className="text-right font-iran"
                >
                  توضیحات
                </Label>
                <Textarea
                  id="categoryDescription"
                  placeholder="توضیحات دسته‌بندی..."
                  value={newCategoryData.description}
                  onChange={(e) =>
                    setNewCategoryData({
                      ...newCategoryData,
                      description: e.target.value,
                    })
                  }
                  className="text-right font-iran"
                  dir="rtl"
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="categoryIsActive"
                  checked={newCategoryData.isActive}
                  onCheckedChange={(checked) =>
                    setNewCategoryData({ ...newCategoryData, isActive: checked })
                  }
                />
                <Label htmlFor="categoryIsActive" className="text-right font-iran">
                  فعال
                </Label>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setCategoryDialogOpen(false)}
                  className="font-iran"
                >
                  انصراف
                </Button>
                <Button onClick={handleCreateCategory} className="font-iran">
                  ایجاد
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Categories List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-right font-iran">
              دسته‌بندی‌های اصلی
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative mb-4">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="جستجو بر اساس نام یا توضیحات..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10 text-right"
                dir="rtl"
              />
            </div>
            <div className="space-y-2">
              {categories.length === 0 ? (
                <div className="text-center py-8">
                  <FolderPlus className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground font-iran">
                    هیچ دسته‌بندی‌ای وجود ندارد
                  </p>
                  <p className="text-sm text-muted-foreground font-iran">
                    برای شروع یک دسته‌بندی جدید ایجاد کنید
                  </p>
                </div>
              ) : (
                categories.map((category) => (
                  <div
                    key={category.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedCategoryId === category.id
                        ? "bg-primary/10 border-primary"
                        : "hover:bg-muted/50"
                    }`}
                    onClick={() => setSelectedCategoryId(category.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="text-right flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium font-iran">
                            {category.name}
                          </h4>
                          {!category.isActive && (
                            <Badge variant="destructive" className="text-xs">
                              غیرفعال
                            </Badge>
                          )}
                        </div>
                        {category.description && (
                          <p className="text-sm text-muted-foreground mt-1 font-iran">
                            {category.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <Badge
                            variant="secondary"
                            className="text-xs font-iran"
                          >
                            {category.subcategories?.length || 0} زیر دسته
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingCategory(category);
                          }}
                          className="font-iran"
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (
                              confirm("آیا از حذف این دسته‌بندی اطمینان دارید؟")
                            ) {
                              handleDeleteCategory(category.id);
                            }
                          }}
                          className="text-red-600 hover:text-red-700 font-iran"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sub Categories */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-right font-iran">
                {selectedCategoryId
                  ? `زیر دسته‌های ${categories.find(c => c.id === selectedCategoryId)?.name || ""}`
                  : "زیر دسته‌ها"}
              </CardTitle>
              {selectedCategoryId && (
                <Dialog
                  open={subCategoryDialogOpen}
                  onOpenChange={setSubCategoryDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button size="sm" className="gap-2 font-iran">
                      <FolderPlus className="w-4 h-4" />
                      زیر دسته جدید
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md font-iran" dir="rtl">
                    <DialogHeader>
                      <DialogTitle className="text-right font-iran">
                        ایجاد زیر دسته جدید
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label
                          htmlFor="subCategoryName"
                          className="text-right font-iran"
                        >
                          نام زیر دسته *
                        </Label>
                        <Input
                          id="subCategoryName"
                          placeholder="مثال: رایانه کار نمی‌کند"
                          value={newSubCategoryData.name}
                          onChange={(e) =>
                            setNewSubCategoryData({
                              ...newSubCategoryData,
                              name: e.target.value,
                            })
                          }
                          className="text-right font-iran"
                          dir="rtl"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="subCategoryDescription"
                          className="text-right font-iran"
                        >
                          توضیحات
                        </Label>
                        <Textarea
                          id="subCategoryDescription"
                          placeholder="توضیحات زیر دسته..."
                          value={newSubCategoryData.description}
                          onChange={(e) =>
                            setNewSubCategoryData({
                              ...newSubCategoryData,
                              description: e.target.value,
                            })
                          }
                          className="text-right font-iran"
                          dir="rtl"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          id="subCategoryIsActive"
                          checked={newSubCategoryData.isActive}
                          onCheckedChange={(checked) =>
                            setNewSubCategoryData({ ...newSubCategoryData, isActive: checked })
                          }
                        />
                        <Label htmlFor="subCategoryIsActive" className="text-right font-iran">
                          فعال
                        </Label>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setSubCategoryDialogOpen(false)}
                          className="font-iran"
                        >
                          انصراف
                        </Button>
                        <Button
                          onClick={handleCreateSubCategory}
                          className="font-iran"
                        >
                          ایجاد
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {selectedCategoryId ? (
              subcategoriesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  <span className="mr-3 text-sm text-muted-foreground">در حال بارگذاری...</span>
                </div>
              ) : subcategories.length === 0 ? (
                <div className="text-center py-8">
                  <FolderPlus className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground font-iran">
                    هیچ زیر دسته‌ای وجود ندارد
                  </p>
                  <p className="text-sm text-muted-foreground font-iran">
                    برای شروع یک زیر دسته جدید ایجاد کنید
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {subcategories.map((subCategory) => (
                    <div key={subCategory.id} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div className="text-right flex-1">
                          <div className="flex items-center gap-2">
                            <h5 className="font-medium font-iran">
                              {subCategory.name}
                            </h5>
                            {!subCategory.isActive && (
                              <Badge variant="secondary" className="text-xs">
                                غیرفعال
                              </Badge>
                            )}
                          </div>
                          {subCategory.description && (
                            <p className="text-sm text-muted-foreground mt-1 font-iran">
                              {subCategory.description}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingSubCategory(subCategory)}
                            className="font-iran"
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openFieldDesigner(subCategory.id)}
                            className="font-iran"
                          >
                            <Settings className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteSubCategory(subCategory.id)}
                            className="text-red-600 hover:text-red-700 font-iran"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              <div className="text-center py-8">
                <Settings className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground font-iran">
                  دسته‌بندی انتخاب کنید
                </p>
                <p className="text-sm text-muted-foreground font-iran">
                  برای مشاهده زیر دسته‌ها، یک دسته‌بندی انتخاب کنید
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Category Dialog */}
      {editingCategory && (
        <Dialog
          open={!!editingCategory}
          onOpenChange={() => setEditingCategory(null)}
        >
          <DialogContent className="max-w-md font-iran" dir="rtl">
            <DialogHeader>
              <DialogTitle className="text-right font-iran">
                ویرایش دسته‌بندی
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="editCategoryName"
                  className="text-right font-iran"
                >
                  نام دسته‌بندی *
                </Label>
                <Input
                  id="editCategoryName"
                  value={editingCategory.name}
                  onChange={(e) =>
                    setEditingCategory({
                      ...editingCategory,
                      name: e.target.value,
                    })
                  }
                  className="text-right font-iran"
                  dir="rtl"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="editCategoryDescription"
                  className="text-right font-iran"
                >
                  توضیحات
                </Label>
                <Textarea
                  id="editCategoryDescription"
                  value={editingCategory.description}
                  onChange={(e) =>
                    setEditingCategory({
                      ...editingCategory,
                      description: e.target.value,
                    })
                  }
                  className="text-right font-iran"
                  dir="rtl"
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="editCategoryIsActive"
                  checked={editingCategory.isActive}
                  onCheckedChange={(checked) =>
                    setEditingCategory({ ...editingCategory, isActive: checked })
                  }
                />
                <Label htmlFor="editCategoryIsActive" className="text-right font-iran">
                  فعال
                </Label>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setEditingCategory(null)}
                  className="font-iran"
                >
                  انصراف
                </Button>
                <Button onClick={handleUpdateCategory} className="font-iran">
                  به‌روزرسانی
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {editingSubCategory && (
        <Dialog
          open={!!editingSubCategory}
          onOpenChange={() => setEditingSubCategory(null)}
        >
          <DialogContent className="max-w-md font-iran" dir="rtl">
            <DialogHeader>
              <DialogTitle className="text-right font-iran">
                ویرایش زیر دسته
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="editSubCategoryName"
                  className="text-right font-iran"
                >
                  نام زیر دسته *
                </Label>
                <Input
                  id="editSubCategoryName"
                  value={editingSubCategory.name}
                  onChange={(e) =>
                    setEditingSubCategory({
                      ...editingSubCategory,
                      name: e.target.value,
                    })
                  }
                  className="text-right font-iran"
                  dir="rtl"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="editSubCategoryDescription"
                  className="text-right font-iran"
                >
                  توضیحات
                </Label>
                <Textarea
                  id="editSubCategoryDescription"
                  value={editingSubCategory.description}
                  onChange={(e) =>
                    setEditingSubCategory({
                      ...editingSubCategory,
                      description: e.target.value,
                    })
                  }
                  className="text-right font-iran"
                  dir="rtl"
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="editSubCategoryIsActive"
                  checked={editingSubCategory.isActive}
                  onCheckedChange={(checked) =>
                    setEditingSubCategory({ ...editingSubCategory, isActive: checked })
                  }
                />
                <Label htmlFor="editSubCategoryIsActive" className="text-right font-iran">
                  فعال
                </Label>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setEditingSubCategory(null)}
                  className="font-iran"
                >
                  انصراف
                </Button>
                <Button onClick={handleUpdateSubCategory} className="font-iran">
                  به‌روزرسانی
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Field Designer Dialog */}
      <Dialog open={fieldDesignerOpen} onOpenChange={setFieldDesignerOpen}>
        <DialogContent
          className="max-w-3xl font-iran"
          dir="rtl"
          aria-describedby={undefined}
        >
          <DialogHeader>
            <DialogTitle className="text-right font-iran">
              طراحی فیلدهای سفارشی
            </DialogTitle>
          </DialogHeader>
          {editingFields.length === 0 && (
            <div className="mb-2 border rounded-md p-3">
              <p className="text-sm text-muted-foreground mb-2 text-right">
                این زیرمسئله از فرم پیش‌فرض استفاده می‌کند. فیلدهای پیش‌فرض
                (نمایشی):
              </p>
              {defaultPreview.length > 0 ? (
                <>
                <div className="grid grid-cols-12 gap-2">
                  {defaultPreview.map((f) => (
                    <div
                      key={f.id}
                      className="col-span-12 md:col-span-6 border rounded px-2 py-1 text-right"
                    >
                      <div className="text-sm">{f.label}</div>
                      <div className="text-[11px] text-muted-foreground">
                        نوع: {f.type}
                        {f.required ? " • اجباری" : ""}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end mt-3">
                  <Button size="sm" onClick={() => setEditingFields(defaultPreview)} className="font-iran">
                    استفاده از همین فیلدها به‌عنوان سفارشی
                  </Button>
                </div>
                </>
              ) : (
                <p className="text-xs text-muted-foreground text-right">
                  برای این مورد، فیلد پیش‌فرضی نمایش داده نشد.
                </p>
              )}
            </div>
          )}
          <div className="space-y-6">
            <div className="space-y-3">
              {editingFields.length === 0 && (
                <p className="text-sm text-muted-foreground text-right">
                  هیچ فیلدی تعریف نشده است.
                </p>
              )}
              {editingFields.map((f, idx) => {
                const optionsText = (f.options || [])
                  .map((o) => `${o.value}:${o.label}`)
                  .join(", ");
                return (
                  <div
                    key={f.id}
                    className="grid grid-cols-12 gap-2 items-end border rounded-md p-3"
                  >
                    <div className="col-span-12 md:col-span-3 space-y-1">
                      <Label className="text-right">شناسه</Label>
                      <Input
                        value={f.id}
                        disabled
                        className="text-right bg-muted"
                        dir="rtl"
                      />
                    </div>
                    <div className="col-span-12 md:col-span-3 space-y-1">
                      <Label className="text-right">عنوان</Label>
                      <Input
                        value={f.label}
                        onChange={(e) =>
                          updateField(idx, { label: e.target.value })
                        }
                        className="text-right"
                        dir="rtl"
                      />
                    </div>
                    <div className="col-span-12 md:col-span-2 space-y-1">
                      <Label className="text-right">نوع</Label>
                      <Select
                        value={f.type}
                        onValueChange={(v) =>
                          updateField(idx, { type: v as any })
                        }
                        dir="rtl"
                      >
                        <SelectTrigger className="text-right">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">متن</SelectItem>
                          <SelectItem value="textarea">چندخطی</SelectItem>
                          <SelectItem value="number">عدد</SelectItem>
                          <SelectItem value="email">ایمیل</SelectItem>
                          <SelectItem value="tel">تلفن</SelectItem>
                          <SelectItem value="date">تاریخ</SelectItem>
                          <SelectItem value="datetime">تاریخ و زمان</SelectItem>
                          <SelectItem value="select">لیست انتخابی</SelectItem>
                          <SelectItem value="radio">گزینه‌ای</SelectItem>
                          <SelectItem value="checkbox">تیک‌زدنی</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-12 md:col-span-2 space-y-1">
                      <Label className="text-right">اجباری؟</Label>
                      <div className="flex gap-2 items-center h-10">
                        <input
                          type="checkbox"
                          checked={!!f.required}
                          onChange={(e) =>
                            updateField(idx, { required: e.target.checked })
                          }
                        />
                        <span className="text-sm">الزامی</span>
                      </div>
                    </div>
                    <div className="col-span-12 md:col-span-6 space-y-1">
                      <Label className="text-right">راهنما</Label>
                      <Input
                        value={f.placeholder || ""}
                        onChange={(e) =>
                          updateField(idx, { placeholder: e.target.value })
                        }
                        className="text-right"
                        dir="rtl"
                      />
                    </div>
                    {(f.type === "select" || f.type === "radio") && (
                      <div className="col-span-12 md:col-span-6 space-y-1">
                        <Label className="text-right">
                          گزینه‌ها (value:label, جداشده با کاما)
                        </Label>
                        <Input
                          value={optionsText}
                          onChange={(e) =>
                            updateField(idx, { optionsText: e.target.value })
                          }
                          className="text-right"
                          dir="rtl"
                        />
                      </div>
                    )}
                    <div className="col-span-12 md:col-span-12 flex justify-end">
                      <Button
                        variant="ghost"
                        className="text-red-600"
                        onClick={() => removeField(idx)}
                      >
                        حذف
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border rounded-lg p-3 space-y-3">
              <h4 className="font-medium text-right">افزودن فیلد جدید</h4>
              <div className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-12 md:col-span-3 space-y-1">
                  <Label className="text-right">شناسه</Label>
                  <Input
                    value={newField.id}
                    onChange={(e) =>
                      setNewField((p) => ({ ...p, id: e.target.value }))
                    }
                    className="text-right"
                    dir="rtl"
                    placeholder="مثال: deviceBrand"
                  />
                </div>
                <div className="col-span-12 md:col-span-3 space-y-1">
                  <Label className="text-right">عنوان</Label>
                  <Input
                    value={newField.label}
                    onChange={(e) =>
                      setNewField((p) => ({ ...p, label: e.target.value }))
                    }
                    className="text-right"
                    dir="rtl"
                    placeholder="برچسب فیلد"
                  />
                </div>
                <div className="col-span-12 md:col-span-2 space-y-1">
                  <Label className="text-right">نوع</Label>
                  <Select
                    value={newField.type}
                    onValueChange={(v) =>
                      setNewField((p) => ({ ...p, type: v as any }))
                    }
                    dir="rtl"
                  >
                    <SelectTrigger className="text-right">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">متن</SelectItem>
                      <SelectItem value="textarea">چندخطی</SelectItem>
                      <SelectItem value="number">عدد</SelectItem>
                      <SelectItem value="email">ایمیل</SelectItem>
                      <SelectItem value="tel">تلفن</SelectItem>
                      <SelectItem value="date">تاریخ</SelectItem>
                      <SelectItem value="datetime">تاریخ و زمان</SelectItem>
                      <SelectItem value="select">لیست انتخابی</SelectItem>
                      <SelectItem value="radio">گزینه‌ای</SelectItem>
                      <SelectItem value="checkbox">تیک‌زدنی</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-12 md:col-span-2">
                  <Label className="text-right block">اجباری؟</Label>
                  <div className="flex gap-2 items-center h-10">
                    <input
                      type="checkbox"
                      checked={newField.required}
                      onChange={(e) =>
                        setNewField((p) => ({
                          ...p,
                          required: e.target.checked,
                        }))
                      }
                    />
                    <span className="text-sm">الزامی</span>
                  </div>
                </div>
                <div className="col-span-12 md:col-span-6 space-y-1">
                  <Label className="text-right">راهنما</Label>
                  <Input
                    value={newField.placeholder}
                    onChange={(e) =>
                      setNewField((p) => ({
                        ...p,
                        placeholder: e.target.value,
                      }))
                    }
                    className="text-right"
                    dir="rtl"
                    placeholder="مثال: مدل دستگاه را وارد کنید"
                  />
                </div>
                {(newField.type === "select" || newField.type === "radio") && (
                  <div className="col-span-12 md:col-span-6 space-y-1">
                    <Label className="text-right">
                      گزینه‌ها (value:label, جداشده با کاما)
                    </Label>
                    <Input
                      value={newField.optionsText}
                      onChange={(e) =>
                        setNewField((p) => ({
                          ...p,
                          optionsText: e.target.value,
                        }))
                      }
                      className="text-right"
                      dir="rtl"
                      placeholder="hp:HP, dell:Dell"
                    />
                  </div>
                )}
                <div className="col-span-12 flex justify-end">
                  <Button onClick={addNewField}>افزودن فیلد</Button>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setFieldDesignerOpen(false)}
                className="font-iran"
              >
                انصراف
              </Button>
              <Button onClick={saveFieldDesigner} className="font-iran">
                ذخیره تغییرات
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Warning Message */}
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
            <div className="text-right">
              <h4 className="font-medium text-orange-800 font-iran">
                نکته مهم
              </h4>
              <p className="text-sm text-orange-700 mt-1 font-iran">
                تغییرات در دسته‌بندی‌ها بلافاصله در فرم ایجاد تیکت کاربران اعمال
                می‌شود. حذف دسته‌بندی‌ها ممکن است بر تیکت‌های موجود تأثیر
                بگذارد.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

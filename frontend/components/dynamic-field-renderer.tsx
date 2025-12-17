"use client"

import { Controller } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { FormFieldDef } from "@/lib/dynamic-forms"

interface DynamicFieldRendererProps {
  field: FormFieldDef
  control: any
  errors: any
}

export function DynamicFieldRenderer({ field, control, errors }: DynamicFieldRendererProps) {
  const name = `dyn_${field.id}`
  const error = errors?.[name]?.message as string | undefined

  const requiredMsg = "این فیلد الزامی است"

  const commonLabel = (
    <Label htmlFor={name} className="text-right">
      {field.label} {field.required ? "*" : ""}
    </Label>
  )

  const help = field.helpText ? (
    <p className="text-xs text-muted-foreground text-right">{field.helpText}</p>
  ) : null

  if (field.type === "textarea") {
    return (
      <div className="space-y-2">
        {commonLabel}
        <Controller
          name={name}
          control={control}
          rules={field.required ? { required: requiredMsg } : undefined}
          render={({ field: rhf }) => (
            <Textarea {...rhf} placeholder={field.placeholder} rows={4} className="text-right" dir="rtl" />
          )}
        />
        {help}
        {error && <p className="text-sm text-red-500 text-right">{error}</p>}
      </div>
    )
  }

  if (field.type === "select" || field.type === "radio") {
    return (
      <div className="space-y-2">
        {commonLabel}
        <Controller
          name={name}
          control={control}
          rules={field.required ? { required: requiredMsg } : undefined}
          render={({ field: rhf }) => (
            <Select onValueChange={rhf.onChange} value={rhf.value} dir="rtl">
              <SelectTrigger className="text-right">
                <SelectValue placeholder={field.placeholder || "انتخاب کنید"} />
              </SelectTrigger>
              <SelectContent className="text-right">
                {(field.options || []).map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {help}
        {error && <p className="text-sm text-red-500 text-right">{error}</p>}
      </div>
    )
  }

  if (field.type === "date" || field.type === "datetime") {
    return (
      <div className="space-y-2">
        {commonLabel}
        <Controller
          name={name}
          control={control}
          rules={field.required ? { required: requiredMsg } : undefined}
          render={({ field: rhf }) => (
            <Input
              {...rhf}
              type={field.type === "datetime" ? "datetime-local" : "date"}
              placeholder={field.placeholder}
              className="text-right"
              dir="rtl"
            />
          )}
        />
        {help}
        {error && <p className="text-sm text-red-500 text-right">{error}</p>}
      </div>
    )
  }

  if (field.type === "checkbox") {
    return (
      <div className="space-y-2">
        {commonLabel}
        <Controller
          name={name}
          control={control}
          rules={field.required ? { required: requiredMsg } : undefined}
          render={({ field: rhf }) => (
            <input
              type="checkbox"
              checked={!!rhf.value}
              onChange={(e) => rhf.onChange(e.target.checked)}
            />
          )}
        />
        {help}
        {error && <p className="text-sm text-red-500 text-right">{error}</p>}
      </div>
    )
  }

  if (field.type === "file") {
    return (
      <div className="space-y-2">
        {commonLabel}
        <Controller
          name={name}
          control={control}
          rules={field.required ? { required: requiredMsg } : undefined}
          render={({ field: rhf }) => (
            <Input
              type="file"
              onChange={(e) => rhf.onChange(e.target.files?.[0] || null)}
            />
          )}
        />
        {help}
        {error && <p className="text-sm text-red-500 text-right">{error}</p>}
      </div>
    )
  }

  const inputType = field.type === "email" || field.type === "tel" || field.type === "number" ? field.type : "text"

  return (
    <div className="space-y-2">
      {commonLabel}
      <Controller
        name={name}
        control={control}
        rules={field.required ? { required: requiredMsg } : undefined}
        render={({ field: rhf }) => (
          <Input
            {...rhf}
            type={inputType}
            placeholder={field.placeholder}
            className="text-right"
            dir="rtl"
            onChange={(e) => {
              if (field.type === "number") {
                const v = e.target.value
                rhf.onChange(v === "" ? "" : Number(v))
              } else {
                rhf.onChange(e.target.value)
              }
            }}
          />
        )}
      />
      {help}
      {error && <p className="text-sm text-red-500 text-right">{error}</p>}
    </div>
  )
}

import * as yup from "yup"
import type { CategoriesData } from "@/services/categories-types"

const requiredMsg = "پر کردن این فیلد الزامی است"

// Phone number validation for Iranian numbers
const validatePhoneNumber = (phone: string): boolean => {
  const iranianPhoneRegex = /^(\+98|0)?9\d{9}$/
  return iranianPhoneRegex.test(phone.replace(/\s/g, ""))
}

// Issue Selection Schema (Step 1)
export const issueSelectionSchema = (categories?: CategoriesData) =>
  yup.object({
    priority: yup.string().required("انتخاب اولویت الزامی است"),
    mainIssue: yup.string().required("انتخاب دسته‌بندی اصلی الزامی است"),
    subIssue: yup.string().when("mainIssue", (mainIssue, schema: yup.StringSchema) => {
      const hasSubIssues =
        typeof mainIssue === "string" &&
        !!mainIssue &&
        !!categories?.[mainIssue] &&
        Object.keys(categories[mainIssue].subIssues || {}).length > 0

      if (hasSubIssues) {
        return schema.required("انتخاب زیرشاخه الزامی است")
      }

      return schema.optional().nullable().transform((value) => value ?? "")
    }),
  })

// Ticket Details Schema (Step 2)
export const ticketDetailsSchema = yup.object({
  title: yup
    .string()
    .required("عنوان تیکت الزامی است")
    .min(5, "عنوان تیکت باید حداقل ۵ کاراکتر باشد")
    .max(100, "عنوان تیکت نباید بیشتر از ۱۰۰ کاراکتر باشد"),
  description: yup
    .string()
    .transform((value) => (value === "" ? undefined : value))
    .optional()
    .min(20, "شرح مشکل باید حداقل ۲۰ کاراکتر باشد")
    .max(2000, "شرح مشکل نباید بیشتر از ۲۰۰۰ کاراکتر باشد"),

  // Additional info fields - required when the related issue/sub-issue is selected
  deviceBrand: yup.string().when(["mainIssue", "subIssue"], {
    is: (mainIssue: string, subIssue: string) =>
      mainIssue === "hardware" &&
      (!subIssue || ["computer-not-working", "printer-issues", "monitor-problems"].includes(subIssue)),
    then: (schema) => schema.required(requiredMsg),
    otherwise: (schema) => schema.optional(),
  }),
  deviceModel: yup.string().when(["mainIssue", "subIssue"], {
    is: (mainIssue: string, subIssue: string) =>
      mainIssue === "hardware" &&
      (!subIssue || ["computer-not-working", "printer-issues", "monitor-problems"].includes(subIssue)),
    then: (schema) => schema.required(requiredMsg),
    otherwise: (schema) => schema.optional(),
  }),
  powerStatus: yup.string().when(["mainIssue", "subIssue"], {
    is: (mainIssue: string, subIssue: string) => mainIssue === "hardware" && subIssue === "computer-not-working",
    then: (schema) => schema.required(requiredMsg),
    otherwise: (schema) => schema.optional(),
  }),
  lastWorking: yup.string().when(["mainIssue", "subIssue"], {
    is: (mainIssue: string, subIssue: string) => mainIssue === "hardware" && subIssue === "computer-not-working",
    then: (schema) => schema.required(requiredMsg),
    otherwise: (schema) => schema.optional(),
  }),
  printerBrand: yup.string().when(["mainIssue", "subIssue"], {
    is: (mainIssue: string, subIssue: string) => mainIssue === "hardware" && subIssue === "printer-issues",
    then: (schema) => schema.required(requiredMsg),
    otherwise: (schema) => schema.optional(),
  }),
  printerType: yup.string().when(["mainIssue", "subIssue"], {
    is: (mainIssue: string, subIssue: string) => mainIssue === "hardware" && subIssue === "printer-issues",
    then: (schema) => schema.required(requiredMsg),
    otherwise: (schema) => schema.optional(),
  }),
  printerProblem: yup.string().when(["mainIssue", "subIssue"], {
    is: (mainIssue: string, subIssue: string) => mainIssue === "hardware" && subIssue === "printer-issues",
    then: (schema) => schema.required(requiredMsg),
    otherwise: (schema) => schema.optional(),
  }),
  monitorSize: yup.string().when(["mainIssue", "subIssue"], {
    is: (mainIssue: string, subIssue: string) => mainIssue === "hardware" && subIssue === "monitor-problems",
    then: (schema) => schema.required(requiredMsg),
    otherwise: (schema) => schema.optional(),
  }),
  connectionType: yup.string().when(["mainIssue", "subIssue"], {
    is: (mainIssue: string, subIssue: string) =>
      (mainIssue === "hardware" && subIssue === "monitor-problems") ||
      (mainIssue === "network" && subIssue === "internet-connection"),
    then: (schema) => schema.required(requiredMsg),
    otherwise: (schema) => schema.optional(),
  }),
  displayIssue: yup.string().when(["mainIssue", "subIssue"], {
    is: (mainIssue: string, subIssue: string) => mainIssue === "hardware" && subIssue === "monitor-problems",
    then: (schema) => schema.required(requiredMsg),
    otherwise: (schema) => schema.optional(),
  }),
  operatingSystem: yup.string().when(["mainIssue", "subIssue"], {
    is: (mainIssue: string, subIssue: string) => mainIssue === "software" && subIssue === "os-issues",
    then: (schema) => schema.required(requiredMsg),
    otherwise: (schema) => schema.optional(),
  }),
  osVersion: yup.string().when(["mainIssue", "subIssue"], {
    is: (mainIssue: string, subIssue: string) => mainIssue === "software" && subIssue === "os-issues",
    then: (schema) => schema.required(requiredMsg),
    otherwise: (schema) => schema.optional(),
  }),
  osIssueType: yup.string().when(["mainIssue", "subIssue"], {
    is: (mainIssue: string, subIssue: string) => mainIssue === "software" && subIssue === "os-issues",
    then: (schema) => schema.required(requiredMsg),
    otherwise: (schema) => schema.optional(),
  }),
  softwareName: yup.string().when(["mainIssue", "subIssue"], {
    is: (mainIssue: string) => mainIssue === "software",
    then: (schema) => schema.required(requiredMsg),
    otherwise: (schema) => schema.optional(),
  }),
  softwareVersion: yup.string().when(["mainIssue", "subIssue"], {
    is: (mainIssue: string, subIssue: string) =>
      mainIssue === "software" && subIssue === "application-problems",
    then: (schema) => schema.required(requiredMsg),
    otherwise: (schema) => schema.optional(),
  }),
  applicationIssue: yup.string().when(["mainIssue", "subIssue"], {
    is: (mainIssue: string, subIssue: string) =>
      mainIssue === "software" && subIssue === "application-problems",
    then: (schema) => schema.required(requiredMsg),
    otherwise: (schema) => schema.optional(),
  }),
  internetProvider: yup.string().when(["mainIssue", "subIssue"], {
    is: (mainIssue: string, subIssue: string) => mainIssue === "network" && subIssue === "internet-connection",
    then: (schema) => schema.required(requiredMsg),
    otherwise: (schema) => schema.optional(),
  }),
  connectionIssue: yup.string().when(["mainIssue", "subIssue"], {
    is: (mainIssue: string, subIssue: string) => mainIssue === "network" && subIssue === "internet-connection",
    then: (schema) => schema.required(requiredMsg),
    otherwise: (schema) => schema.optional(),
  }),
  wifiNetwork: yup.string().when(["mainIssue", "subIssue"], {
    is: (mainIssue: string, subIssue: string) => mainIssue === "network" && subIssue === "wifi-problems",
    then: (schema) => schema.required(requiredMsg),
    otherwise: (schema) => schema.optional(),
  }),
  deviceType: yup.string().when(["mainIssue", "subIssue"], {
    is: (mainIssue: string, subIssue: string) => mainIssue === "network" && subIssue === "wifi-problems",
    then: (schema) => schema.required(requiredMsg),
    otherwise: (schema) => schema.optional(),
  }),
  wifiIssue: yup.string().when(["mainIssue", "subIssue"], {
    is: (mainIssue: string, subIssue: string) => mainIssue === "network" && subIssue === "wifi-problems",
    then: (schema) => schema.required(requiredMsg),
    otherwise: (schema) => schema.optional(),
  }),
  networkLocation: yup.string().when("mainIssue", {
    is: (mainIssue: string) => mainIssue === "network",
    then: (schema) => schema.required(requiredMsg),
    otherwise: (schema) => schema.optional(),
  }),
  emailProvider: yup.string().when("mainIssue", {
    is: (mainIssue: string) => mainIssue === "email",
    then: (schema) => schema.required(requiredMsg),
    otherwise: (schema) => schema.optional(),
  }),
  emailClient: yup.string().when("mainIssue", {
    is: (mainIssue: string) => mainIssue === "email",
    then: (schema) => schema.required(requiredMsg),
    otherwise: (schema) => schema.optional(),
  }),
  errorMessage: yup.string().when("mainIssue", {
    is: (mainIssue: string) => mainIssue === "email",
    then: (schema) => schema.required(requiredMsg),
    otherwise: (schema) => schema.optional(),
  }),
  emailAddress: yup.string().email("فرمت ایمیل صحیح نیست").optional(),
  incidentTime: yup.string().when("mainIssue", {
    is: (mainIssue: string) => mainIssue === "security",
    then: (schema) => schema.required(requiredMsg),
    otherwise: (schema) => schema.optional(),
  }),
  securitySeverity: yup.string().when("mainIssue", {
    is: (mainIssue: string) => mainIssue === "security",
    then: (schema) => schema.required(requiredMsg),
    otherwise: (schema) => schema.optional(),
  }),
  affectedData: yup.string().when("mainIssue", {
    is: (mainIssue: string) => mainIssue === "security",
    then: (schema) => schema.required(requiredMsg),
    otherwise: (schema) => schema.optional(),
  }),
  requestedSystem: yup.string().when("mainIssue", {
    is: (mainIssue: string) => mainIssue === "access",
    then: (schema) => schema.required(requiredMsg),
    otherwise: (schema) => schema.optional(),
  }),
  accessLevel: yup.string().when("mainIssue", {
    is: (mainIssue: string) => mainIssue === "access",
    then: (schema) => schema.required(requiredMsg),
    otherwise: (schema) => schema.optional(),
  }),
  accessReason: yup.string().when("mainIssue", {
    is: (mainIssue: string) => mainIssue === "access",
    then: (schema) => schema.required(requiredMsg),
    otherwise: (schema) => schema.optional(),
  }),
  urgencyLevel: yup.string().optional(),
  trainingTopic: yup.string().when("mainIssue", {
    is: (mainIssue: string) => mainIssue === "training",
    then: (schema) => schema.required(requiredMsg),
    otherwise: (schema) => schema.optional(),
  }),
  currentLevel: yup.string().when("mainIssue", {
    is: (mainIssue: string) => mainIssue === "training",
    then: (schema) => schema.required(requiredMsg),
    otherwise: (schema) => schema.optional(),
  }),
  preferredMethod: yup.string().when("mainIssue", {
    is: (mainIssue: string) => mainIssue === "training",
    then: (schema) => schema.required(requiredMsg),
    otherwise: (schema) => schema.optional(),
  }),
  equipmentType: yup.string().when("mainIssue", {
    is: (mainIssue: string) => mainIssue === "maintenance",
    then: (schema) => schema.required(requiredMsg),
    otherwise: (schema) => schema.optional(),
  }),
  maintenanceType: yup.string().when("mainIssue", {
    is: (mainIssue: string) => mainIssue === "maintenance",
    then: (schema) => schema.required(requiredMsg),
    otherwise: (schema) => schema.optional(),
  }),
  preferredTime: yup.string().when("mainIssue", {
    is: (mainIssue: string) => mainIssue === "maintenance",
    then: (schema) => schema.required(requiredMsg),
    otherwise: (schema) => schema.optional(),
  }),
})

// Contact Information Schema - always required
export const contactInfoSchema = yup.object({
  clientName: yup
    .string()
    .required("نام الزامی است")
    .min(2, "نام باید حداقل ۲ کاراکتر باشد")
    .max(50, "نام نباید بیشتر از ۵۰ کاراکتر باشد"),

  clientEmail: yup.string().required("ایمیل الزامی است").email("فرمت ایمیل صحیح نیست"),

  clientPhone: yup
    .string()
    .required("شماره تماس الزامی است")
    .test("phone-validation", "شماره تماس معتبر نیست", validatePhoneNumber),
})

// Update the combined schema to include contact info
export const getCombinedSchema = (step: number, categories?: CategoriesData) => {
  const baseSchema = contactInfoSchema.concat(issueSelectionSchema(categories))

  if (step === 1) {
    return baseSchema
  } else {
    return baseSchema.concat(ticketDetailsSchema)
  }
}

// Legacy schemas for backward compatibility
export const generalInfoSchema = issueSelectionSchema()

// Ticket access schema
export const ticketAccessSchema = yup.object({
  ticketId: yup
    .string()
    .required("کد تیکت الزامی است")
    .matches(/^TK-\d{4}-\d{3}$/, "فرمت کد تیکت نامعتبر است (مثال: TK-2024-001)"),

  email: yup.string().required("ایمیل الزامی است").email("فرمت ایمیل صحیح نیست"),

  phone: yup
    .string()
    .required("شماره تماس الزامی است")
    .test("phone-validation", "شماره تماس معتبر نیست", validatePhoneNumber),
})

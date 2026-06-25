/*
|--------------------------------------------------------------------------
| Xendit API Types
|--------------------------------------------------------------------------
|
| Request and response types for all 9 Xendit payment products.
| Field names follow xendit-node SDK conventions (camelCase).
|
*/

/**
 * Configuration for the Xendit payment provider
 */
export type XenditConfig = {
  secretKey: string
  environment: 'sandbox' | 'production'
  callbackToken?: string
  timeoutMs?: number
}

// -------------------------------------------------------------------------
// Shared / Common Types
// -------------------------------------------------------------------------

export interface XenditMetadata {
  [key: string]: string | number | boolean | null | undefined
}

export type XenditCurrency =
  | 'IDR'
  | 'PHP'
  | 'USD'
  | 'VND'
  | 'THB'
  | 'MYR'
  | 'SGD'
  | 'EUR'
  | 'GBP'
  | 'HKD'
  | 'AUD'

export type XenditCountry = 'ID' | 'PH' | 'VN' | 'TH' | 'MY'

export type InvoiceStatus = 'PENDING' | 'PAID' | 'SETTLED' | 'EXPIRED'

export type PaymentChannelCategory =
  | 'BANK_TRANSFER'
  | 'EWALLET'
  | 'QR_CODE'
  | 'RETAIL_OUTLET'
  | 'DIRECT_DEBIT'
  | 'CREDIT_CARD'
  | 'PAYLATER'

// -------------------------------------------------------------------------
// 1. Invoice
// -------------------------------------------------------------------------

export interface CreateInvoiceRequest {
  external_id: string
  amount: number
  payer_email?: string
  description?: string
  invoice_duration?: number
  should_send_email?: boolean
  customer?: CustomerObject
  customer_notification_preference?: NotificationPreference
  success_redirect_url?: string
  failure_redirect_url?: string
  currency?: XenditCurrency
  items?: InvoiceItem[]
  fixed_va?: boolean
  locale?: string
  reminder_date?: string
  metadata?: XenditMetadata
}

export interface ListInvoicesParams {
  external_id?: string
  status?: InvoiceStatus
  limit?: number
  created_after?: string
  created_before?: string
  paid_after?: string
  paid_before?: string
  last_invoice_date?: string
}

export interface Invoice {
  id: string
  external_id: string
  user_id: string
  status: InvoiceStatus
  merchant_name: string
  merchant_profile_picture_url: string
  amount: number
  payer_email?: string
  description?: string
  invoice_url: string
  expiry_date: string
  available_banks: Bank[]
  available_retail_outlets: RetailOutletInfo[]
  available_ewallets: EwalletInfo[]
  available_qr_codes: QrCodeInfo[]
  available_direct_debits: DirectDebitInfo[]
  available_paylaters: PaylaterInfo[]
  should_exclude_credit_card?: boolean
  should_send_email: boolean
  created: string
  updated: string
  success_redirect_url?: string
  failure_redirect_url?: string
  should_authenticate_credit_card?: boolean
  currency: XenditCurrency
  items?: InvoiceItem[]
  fixed_va?: boolean
  reminder_date?: string
  customer?: CustomerObject
  customer_notification_preference?: NotificationPreference
  metadata?: XenditMetadata
  paid_at?: string
  paid_amount?: number
  adjusted_received_amount?: number
  payment_method?: string
  payment_channel?: string
  payment_destination?: string
}

export interface InvoiceItem {
  name: string
  quantity: number
  price: number
  category?: string
  url?: string
}

export interface CustomerObject {
  id?: string
  given_names?: string
  surname?: string
  email?: string
  mobile_number?: string
  address?: CustomerAddress
}

export interface CustomerAddress {
  country: string
  street_line_1?: string
  street_line_2?: string
  city?: string
  province?: string
  state?: string
  postal_code?: string
}

export interface NotificationPreference {
  invoice_created?: ('SMS' | 'EMAIL' | 'WA')[]
  invoice_reminder?: ('SMS' | 'EMAIL' | 'WA')[]
  invoice_paid?: ('SMS' | 'EMAIL' | 'WA')[]
}

export interface Bank {
  bank_code: string
  collection_type: string
  bank_branch?: string
  bank_account_number?: string
  account_holder_name: string
  transfer_amount?: number
}

export interface RetailOutletInfo {
  retail_outlet_name: string
  transfer_amount: number
}

export interface EwalletInfo {
  ewallet_type: string
}

export interface QrCodeInfo {
  qr_code_type: string
}

export interface DirectDebitInfo {
  direct_debit_type: string
}

export interface PaylaterInfo {
  paylater_type: string
}

// -------------------------------------------------------------------------
// 2. Virtual Account (VA)
// -------------------------------------------------------------------------

export type VirtualAccountChannelCode =
  | 'BNI'
  | 'BRI'
  | 'MANDIRI'
  | 'BCA'
  | 'PERMATA'
  | 'CIMB'
  | 'BSI'
  | 'SAHABAT_SAMPOERNA'
  | 'BANK_TRANSFER'
  | 'BANK_JAGO'
  | 'BANK_JTRUST'
  | 'BANK_MAYBANK'
  | 'BANK_NEO'
  | 'BANK_OCBC'
  | 'BANK_SINARMAS'
  | 'BANK_UOB'

export type VirtualAccountStatus = 'ACTIVE' | 'INACTIVE' | 'EXPIRED'

export interface CreateVirtualAccountRequest {
  external_id: string
  bank_code: VirtualAccountChannelCode
  name: string
  is_single_use?: boolean
  is_closed?: boolean
  expected_amount?: number
  expiration_date?: string
  suggested_amount?: number
  description?: string
  metadata?: XenditMetadata
  currency?: XenditCurrency
  alternative_display_types?: string[]
}

export interface VirtualAccount {
  id: string
  external_id: string
  user_id: string
  bank_code: VirtualAccountChannelCode
  account_number: string
  name: string
  is_single_use: boolean
  is_closed: boolean
  expiration_date?: string
  expected_amount?: number
  suggested_amount?: number
  description?: string
  status: VirtualAccountStatus
  currency: XenditCurrency
  metadata?: XenditMetadata
  alternative_display_types?: string[]
}

export interface UpdateVirtualAccountRequest {
  name?: string
  suggested_amount?: number
  expected_amount?: number
  expiration_date?: string
  description?: string
  is_single_use?: boolean
  status?: VirtualAccountStatus
  metadata?: XenditMetadata
}

export interface VAPayment {
  id: string
  payment_id: string
  business_id: string
  reference_id: string
  bank_code: VirtualAccountChannelCode
  account_number: string
  currency: XenditCurrency
  status: 'PENDING' | 'SETTLED'
  amount?: number
  paid_amount?: number
  paid_at?: string
  sender_name?: string
  updated: string
  created: string
}

// -------------------------------------------------------------------------
// 3. E-Wallet
// -------------------------------------------------------------------------

export type EWalletChannelCode =
  | 'ID_OVO'
  | 'ID_DANA'
  | 'ID_LINKAJA'
  | 'ID_SHOPEEPAY'
  | 'ID_GO_PAY'
  | 'ID_ASTRAPAY'
  | 'ID_JENIUS'
  | 'ID_NEXCASH'
  | 'ID_SAKUKU'
  | 'PH_GCASH'
  | 'PH_PAYMAYA'
  | 'PH_GRABPAY'
  | 'VN_MOMO'
  | 'VN_ZALOPAY'
  | 'TH_TRUEMONEY'
  | 'MY_TOUCHNGO'
  | 'MY_GRABPAY'

export type EWalletStatus = 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'EXPIRED'

export interface CreateEWalletChargeRequest {
  reference_id: string
  currency: XenditCurrency
  amount: number
  checkout_method?: 'ONE_TIME_PAYMENT' | 'TOKENIZATION'
  channel_code: EWalletChannelCode
  channel_properties?: EWalletChannelProperties
  basket?: BasketItem[]
  metadata?: XenditMetadata
  customer_id?: string
  billing_information?: BillingInformation
  shipping_information?: ShippingInformation
  success_redirect_url?: string
  failure_redirect_url?: string
}

export interface EWalletChannelProperties {
  mobile_number?: string
  success_redirect_url?: string
  failure_redirect_url?: string
  cancel_redirect_url?: string
  require_auth?: boolean
}

export interface BasketItem {
  reference_id?: string
  name: string
  category?: string
  market?: string
  price: number
  quantity: number
  type?: string
  sub_category?: string
  description?: string
  url?: string
}

export interface EWalletCharge {
  id: string
  business_id: string
  reference_id: string
  status: EWalletStatus
  currency: XenditCurrency
  charge_amount: number
  capture_amount?: number
  refunded_amount?: number
  channel_code: EWalletChannelCode
  channel_properties?: EWalletChannelProperties
  actions?: EWalletAction[]
  basket?: BasketItem[]
  metadata?: XenditMetadata
  customer_id?: string
  billing_information?: BillingInformation
  shipping_information?: ShippingInformation
  payment_method_id?: string
  failure_code?: string
  created: string
  updated: string
}

export interface EWalletAction {
  name: string
  method: 'GET' | 'POST'
  url: string
}

export interface BillingInformation {
  country: string
  street_line_1?: string
  street_line_2?: string
  city?: string
  province?: string
  state?: string
  postal_code?: string
}

export interface ShippingInformation {
  country: string
  street_line_1?: string
  street_line_2?: string
  city?: string
  province?: string
  state?: string
  postal_code?: string
}

// -------------------------------------------------------------------------
// 4. QRIS
// -------------------------------------------------------------------------

export type QRCodeType = 'DYNAMIC' | 'STATIC'
export type QRCodeStatus = 'ACTIVE' | 'INACTIVE'

export interface CreateQRCodeRequest {
  external_id: string
  type: QRCodeType
  amount?: number
  callback_url?: string
  currency?: XenditCurrency
  metadata?: XenditMetadata
}

export interface QRCode {
  id: string
  external_id: string
  type: QRCodeType
  status: QRCodeStatus
  amount?: number
  qr_string: string
  callback_url?: string
  currency: XenditCurrency
  reference_id?: string
  metadata?: XenditMetadata
  created: string
  updated: string
  expires_at?: string
}

export interface QRCodePayment {
  id: string
  external_id: string
  amount: number
  currency: XenditCurrency
  qr_code: QRCode
  status: string
  payment_detail: QRCodePaymentDetail
  created: string
}

export interface QRCodePaymentDetail {
  rrn?: string
  source?: string
}

export interface SimulateQRCodeRequest {
  amount: number
}

// -------------------------------------------------------------------------
// 5. Retail Outlet
// -------------------------------------------------------------------------

export type RetailOutletChannelCode =
  | 'ALFAMART'
  | 'ALFAMIDI'
  | 'INDOMARET'
  | 'CEBUANA'
  | 'ECPAY'
  | 'PALAWAN'
  | 'MLHUILLIER'
  | 'LBC'
  | 'DP_ALFAMART'
  | 'DP_ALFAMIDI'
  | 'DP_INDOMARET'

export type RetailOutletStatus = 'ACTIVE' | 'INACTIVE' | 'EXPIRED'

export interface CreateRetailOutletRequest {
  external_id: string
  retail_outlet_name: RetailOutletChannelCode
  name: string
  expected_amount?: number
  payment_code?: string
  expiration_date?: string
  is_single_use?: boolean
  description?: string
  metadata?: XenditMetadata
  currency?: XenditCurrency
}

export interface RetailOutlet {
  id: string
  external_id: string
  user_id: string
  retail_outlet_name: RetailOutletChannelCode
  name: string
  payment_code: string
  expected_amount?: number
  status: RetailOutletStatus
  is_single_use: boolean
  expiration_date?: string
  description?: string
  currency: XenditCurrency
  metadata?: XenditMetadata
  created: string
  updated: string
}

export interface UpdateRetailOutletRequest {
  name?: string
  expected_amount?: number
  expiration_date?: string
  description?: string
  is_single_use?: boolean
  status?: RetailOutletStatus
  metadata?: XenditMetadata
}

// -------------------------------------------------------------------------
// 6. Credit Card
// -------------------------------------------------------------------------

export type CreditCardStatus =
  | 'PENDING'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'REVERSED'
  | 'REFUNDED'
  | 'VOIDED'
  | 'AUTHORIZED'

export interface CreateCreditCardChargeRequest {
  token_id: string
  external_id: string
  amount: number
  authentication_id?: string
  billing_details?: CreditCardBillingDetails
  shipping_details?: CreditCardShippingDetails
  currency?: XenditCurrency
  capture?: boolean
  card_cvn?: string
  descriptor?: string
  installment?: CreditCardInstallment
  metadata?: XenditMetadata
}

export interface CreditCardBillingDetails {
  given_names?: string
  surname?: string
  email?: string
  phone?: string
  address?: CustomerAddress
}

export interface CreditCardShippingDetails {
  given_names?: string
  surname?: string
  email?: string
  phone?: string
  address?: CustomerAddress
  tracking_number?: string
}

export interface CreditCardInstallment {
  count: number
  interval?: string
}

export interface CreditCardCharge {
  id: string
  external_id: string
  user_id: string
  status: CreditCardStatus
  amount: number
  merchant_fee?: number
  fee_merchant?: number
  currency: XenditCurrency
  card_brand?: string
  card_type?: string
  masked_card_number?: string
  bank?: string
  descriptor?: string
  approval_code?: string
  authentication_id?: string
  token_id?: string
  business_id?: string
  capture_amount?: number
  fee_capture_amount?: number
  refunded_amount?: number
  installment?: CreditCardInstallment
  billing_details?: CreditCardBillingDetails
  shipping_details?: CreditCardShippingDetails
  metadata?: XenditMetadata
  created: string
  updated: string
}

export interface CreateCreditCardAuthRequest {
  token_id: string
  external_id: string
  amount: number
  card_cvn?: string
  currency?: XenditCurrency
  descriptor?: string
  billing_details?: CreditCardBillingDetails
  shipping_details?: CreditCardShippingDetails
  metadata?: XenditMetadata
}

export interface CreditCardAuth {
  id: string
  external_id: string
  user_id: string
  status: CreditCardStatus
  amount: number
  currency: XenditCurrency
  card_brand?: string
  card_type?: string
  masked_card_number?: string
  bank?: string
  descriptor?: string
  token_id?: string
  metadata?: XenditMetadata
  created: string
  updated: string
}

export interface CreateCreditCardRefundRequest {
  external_id: string
  amount: number
  metadata?: XenditMetadata
}

export interface CreditCardRefund {
  id: string
  external_id: string
  user_id: string
  charge_id: string
  status: 'PENDING' | 'SUCCEEDED' | 'FAILED'
  amount: number
  failure_reason?: string
  metadata?: XenditMetadata
  created: string
  updated: string
}

// -------------------------------------------------------------------------
// 7. Direct Debit
// -------------------------------------------------------------------------

export type DirectDebitChannelCode =
  | 'BCA_ONEKLIK'
  | 'BCA_KLIKPAY'
  | 'BRI'
  | 'MANDIRI'
  | 'MANDIRI_SNAP'
  | 'BNI'
  | 'PERMATA'
  | 'BJB'
  | 'BSI'
  | 'BTN'
  | 'BANK_TRANSFER'
  | 'BANK_JAGO'

export type DirectDebitStatus = 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'ACTIVE'

export interface CreateDirectDebitPaymentMethodRequest {
  customer_id: string
  channel_code: DirectDebitChannelCode
  properties?: Record<string, string>
  metadata?: XenditMetadata
}

export interface ValidateDirectDebitOTPRequest {
  otp_code: string
}

export interface DirectDebitPaymentMethod {
  id: string
  business_id: string
  reference_id: string
  customer_id: string
  status: DirectDebitStatus
  channel_code: string
  properties?: Record<string, string>
  metadata?: XenditMetadata
  created: string
  updated: string
}

export interface CreateDirectDebitPaymentRequest {
  reference_id: string
  payment_method_id: string
  currency: XenditCurrency
  amount: number
  callback_url?: string
  enable_otp?: boolean
  device?: DirectDebitDevice
  success_redirect_url?: string
  failure_redirect_url?: string
  metadata?: XenditMetadata
}

export interface DirectDebitDevice {
  id: string
  ip_address?: string
  user_agent?: string
  fingerprint?: string
}

export interface DirectDebitPayment {
  id: string
  reference_id: string
  business_id: string
  currency: XenditCurrency
  amount: number
  country: string
  status: DirectDebitStatus
  payment_method_id: string
  channel_code: string
  failure_code?: string
  description?: string
  callback_url?: string
  enable_otp?: boolean
  device?: DirectDebitDevice
  metadata?: XenditMetadata
  actions?: DirectDebitAction[]
  created: string
  updated: string
}

export interface DirectDebitAction {
  name: string
  method: 'GET' | 'POST'
  url: string
}

// -------------------------------------------------------------------------
// 8. Disbursement
// -------------------------------------------------------------------------

export type DisbursementChannelCode =
  | 'BCA'
  | 'BNI'
  | 'BRI'
  | 'MANDIRI'
  | 'PERMATA'
  | 'CIMB'
  | 'BANK_TRANSFER'
  | 'ALFAMART'
  | 'OVO'
  | 'DANA'
  | 'LINKAJA'
  | 'SHOPEEPAY'

export type DisbursementStatus = 'PENDING' | 'SUCCEEDED' | 'FAILED'

export interface CreateDisbursementRequest {
  external_id: string
  amount: number
  bank_code: DisbursementChannelCode
  account_holder_name: string
  account_number: string
  description?: string
  email_to?: string[]
  email_cc?: string[]
  email_bcc?: string[]
  metadata?: XenditMetadata
}

export interface Disbursement {
  id: string
  user_id: string
  external_id: string
  amount: number
  bank_code: DisbursementChannelCode
  account_holder_name: string
  account_number: string
  status: DisbursementStatus
  description?: string
  failure_code?: string
  email_to?: string[]
  email_cc?: string[]
  email_bcc?: string[]
  metadata?: XenditMetadata
  transaction_fee?: number
  created: string
  updated: string
  completed_at?: string
  estimated_arrival_time?: string
}

export interface CreateBatchDisbursementRequest {
  reference: string
  disbursements: CreateDisbursementRequest[]
}

export interface BatchDisbursement {
  id: string
  reference: string
  total_disbursed_amount: number
  total_uploaded_amount: number
  status: string
  created: string
  updated: string
}

export interface DisbursementBank {
  name: string
  code: DisbursementChannelCode
  can_disburse: boolean
}

// -------------------------------------------------------------------------
// 9. Balance
// -------------------------------------------------------------------------

export type BalanceAccountType = 'CASH' | 'HOLDING' | 'TAX'

export interface GetBalanceRequest {
  account_type?: BalanceAccountType
  currency?: XenditCurrency
  at_timestamp?: string
}

export interface Balance {
  balance: number
}

// -------------------------------------------------------------------------
// Generic API Response Wrapper
// -------------------------------------------------------------------------

export interface XenditApiError {
  error_code: string
  message: string
  status_code?: number
  errors?: XenditValidationErrorDetail[]
}

export interface XenditValidationErrorDetail {
  path: string
  message: string
}

export type XenditWebhookEventName =
  | 'invoice.paid'
  | 'invoice.expired'
  | 'va.paid'
  | 'disbursement.created'
  | 'disbursement.completed'
  | 'disbursement.failed'
  | 'ewallet.payment'
  | 'card_charge.succeeded'
  | 'card_charge.failed'
  | 'qris.payment'
  | 'retail_outlet.payment'
  | 'direct_debit.payment'
  | 'fva.created'
  | 'recurring_payment.stopped'
  | 'payment_method.activated'
  | 'payment_method.expired'
  | 'payment.succeeded'
  | 'payment.failed'
  | 'payment.callback'
export interface XenditWebhookEvent {
  event: XenditWebhookEventName
  data: Record<string, unknown>
}

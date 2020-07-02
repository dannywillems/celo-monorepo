import { CURRENCY_ENUM } from '@celo/utils'
import { PincodeType } from 'src/account/reducer'
import {
  AppEvents,
  CeloExchangeEvents,
  EscrowEvents,
  FeeEvents,
  GethEvents,
  IdentityEvents,
  InviteEvents,
  NotificationEvents,
  OnboardingEvents,
  RequestEvents,
  SendEvents,
  SettingsEvents,
  TransactionEvents,
  VerificationEvents,
} from 'src/analytics/Events'
import { BackQuizProgress, ScrollDirection } from 'src/analytics/types'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { NotificationBannerCTATypes, NotificationBannerTypes } from 'src/home/NotificationBox'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { RecipientKind } from 'src/recipients/recipient'

interface AppEventsProperties {
  [AppEvents.app_launched]: {
    // TODO: Figure out how to measure loadingDuration iOS and make param required
    loadingDuration?: number
    deviceInfo?: object
  }
  [AppEvents.app_state_error]: {
    error: string
  }
  [AppEvents.error_displayed]: {
    error: string
  }
  [AppEvents.error_fallback]: {
    error: ErrorMessages
  }
  [AppEvents.error_boundary]: {
    error: string
  }
  [AppEvents.user_restart]: undefined
  [AppEvents.fetch_balance]: {
    dollarBalance?: string
    goldBalance?: string
  }
}

interface SettingsEventsProperties {
  [SettingsEvents.edit_profile]: undefined
  [SettingsEvents.edit_name]: undefined
  [SettingsEvents.language_select]: {
    language: string
  }
}

interface NotificationEventsProperties {
  [NotificationEvents.notification_scroll]: {
    // TODO: Pass in notificationType and make param required
    notificationType?: NotificationBannerTypes
    direction: ScrollDirection
  }
  [NotificationEvents.notification_select]: {
    notificationType: NotificationBannerTypes
    selectedAction: NotificationBannerCTATypes
  }
}

interface OnboardingEventsProperties {
  [OnboardingEvents.backup_education_start]: undefined
  [OnboardingEvents.backup_education_scroll]: {
    currentStep: number
    direction: ScrollDirection
  }
  [OnboardingEvents.backup_education_complete]: undefined
  [OnboardingEvents.backup_education_cancel]: undefined

  [OnboardingEvents.backup_start]: undefined
  [OnboardingEvents.backup_continue]: undefined
  [OnboardingEvents.backup_complete]: undefined
  [OnboardingEvents.backup_more_info]: undefined
  [OnboardingEvents.backup_delay]: undefined
  [OnboardingEvents.backup_delay_confirm]: undefined
  [OnboardingEvents.backup_delay_cancel]: undefined
  [OnboardingEvents.backup_cancel]: undefined
  [OnboardingEvents.backup_error]: {
    error: string
    context?: string
  }

  [OnboardingEvents.backup_quiz_start]: undefined
  [OnboardingEvents.backup_quiz_progress]: {
    action: BackQuizProgress
  }
  [OnboardingEvents.backup_quiz_complete]: undefined
  [OnboardingEvents.backup_quiz_incorrect]: undefined

  [OnboardingEvents.celo_education_start]: undefined
  [OnboardingEvents.celo_education_scroll]: {
    currentStep: number
    direction: ScrollDirection
  }
  [OnboardingEvents.celo_education_complete]: undefined
  [OnboardingEvents.celo_education_cancel]: undefined

  [OnboardingEvents.phone_number_set]: {
    countryCode: string
  }
  [OnboardingEvents.phone_number_invalid]: {
    obfuscatedPhoneNumber: string
  }

  [OnboardingEvents.pin_set]: undefined
  [OnboardingEvents.pin_invalid]: {
    error: string
  }
  [OnboardingEvents.pin_failed_to_set]: {
    pincodeType: PincodeType
    error: string
  }
  [OnboardingEvents.pin_never_set]: undefined

  [OnboardingEvents.wallet_import_start]: undefined
  [OnboardingEvents.wallet_import_complete]: undefined
  [OnboardingEvents.wallet_import_cancel]: undefined

  [OnboardingEvents.invite_redeem_start]: undefined
  [OnboardingEvents.invite_redeem_complete]: undefined
  [OnboardingEvents.invite_redeem_timeout]: undefined
  [OnboardingEvents.invite_redeem_error]: {
    error: string
  }

  [OnboardingEvents.invite_redeem_skip_start]: undefined
  [OnboardingEvents.invite_redeem_skip_complete]: undefined
  [OnboardingEvents.invite_redeem_skip_error]: {
    error: string
  }
}

interface VerificationEventsProperties {
  [VerificationEvents.verification_start]: undefined
  [VerificationEvents.verification_complete]: undefined
  [VerificationEvents.verification_error]: {
    error: string
  }
  [VerificationEvents.verification_cancel]: undefined
  [VerificationEvents.verification_timeout]: undefined

  [VerificationEvents.verification_hash_retrieved]: {
    phoneHash: string
    address: string
  }
  [VerificationEvents.verification_fetch_status_start]: undefined
  [VerificationEvents.verification_fetch_status_complete]: {
    isVerified: boolean
    numAttestationsRemaining: number
    total: number
    completed: number
  }

  [VerificationEvents.verification_request_all_attestations_start]: {
    attestationsToRequest: number
  }
  [VerificationEvents.verification_request_all_attestations_refresh_progress]: {
    attestationsRemaining: number
  }
  [VerificationEvents.verification_request_all_attestations_complete]: {
    issuers: string[]
  }

  [VerificationEvents.verification_request_attestation_start]: {
    currentAttestation: number
  }
  [VerificationEvents.verification_request_attestation_approve_tx_sent]: undefined
  [VerificationEvents.verification_request_attestation_request_tx_sent]: undefined
  [VerificationEvents.verification_request_attestation_await_issuer_selection]: undefined
  [VerificationEvents.verification_request_attestation_select_issuer]: undefined
  [VerificationEvents.verification_request_attestation_issuer_tx_sent]: undefined
  [VerificationEvents.verification_request_attestation_complete]: undefined

  [VerificationEvents.verification_code_received]:
    | undefined
    | {
        context: string
      }
  [VerificationEvents.verification_code_validate_start]: {
    issuer: any
  }
  [VerificationEvents.verification_code_validate_complete]: {
    issuer: any
  }
  [VerificationEvents.verification_account_set]: undefined

  [VerificationEvents.verification_reveal_all_attestations_start]: undefined
  [VerificationEvents.verification_reveal_attestation_revealed]: {
    issuer: any
  }
  [VerificationEvents.verification_reveal_attestation_await_code_start]: {
    issuer: any
  }
  [VerificationEvents.verification_reveal_all_attestations_complete]: undefined

  [VerificationEvents.verification_reveal_attestation_start]: {
    issuer: any
  }
  [VerificationEvents.verification_reveal_attestation_await_code_complete]: {
    issuer: any
  }
  [VerificationEvents.verification_reveal_attestation_complete]: {
    issuer: any
  }
  [VerificationEvents.verification_reveal_attestation_error]: {
    issuer: any
    error: string
  }
}

interface IdentityEventsProperties {
  [IdentityEvents.contacts_connect]: {
    matchMakingEnabled: boolean
  }
  [IdentityEvents.contacts_import_permission_denied]: undefined
  [IdentityEvents.contacts_import_start]: undefined
  [IdentityEvents.contacts_import_complete]: {
    contactImportCount: number
  }
  [IdentityEvents.contacts_processing_complete]: undefined
  [IdentityEvents.contacts_matchmaking_complete]: {
    matchCount: number
  }
  [IdentityEvents.contacts_import_error]: {
    error: string
  }

  [IdentityEvents.phone_number_lookup_start]: undefined
  [IdentityEvents.phone_number_lookup_complete]: undefined
  [IdentityEvents.phone_number_lookup_error]: {
    error: string
  }

  [IdentityEvents.phone_number_lookup_purchase_complete]: undefined
  [IdentityEvents.phone_number_lookup_purchase_error]: {
    error: string
  }
  [IdentityEvents.phone_number_lookup_purchase_skip]: undefined
}

interface InviteEventsProperties {
  [InviteEvents.invite_tx_start]: undefined
  [InviteEvents.invite_tx_complete]: undefined
  [InviteEvents.invite_tx_error]: {
    error: string
  }
  [InviteEvents.invite_method_sms]: undefined
  [InviteEvents.invite_method_whatsapp]: undefined
  [InviteEvents.invite_method_error]: {
    error: string
  }
}

interface EscrowEventsProperties {
  [EscrowEvents.escrowed_payment_review]: undefined
  [EscrowEvents.escrow_transfer]: undefined
  [EscrowEvents.escrowed_payment_reclaimed_by_sender]: undefined
  [EscrowEvents.escrowed_payment_reclaimEdit_by_sender]: undefined
  [EscrowEvents.escrowed_payment_withdrawn_by_receiver]: undefined
  [EscrowEvents.escrow_failed_to_withdraw]: {
    error: string
  }
  [EscrowEvents.escrow_failed_to_reclaim]: {
    error: string
  }
  [EscrowEvents.escrow_failed_to_transfer]: {
    error: string
  }
  [EscrowEvents.escrow_failed_to_fetch_sent]: {
    error: string
  }
}

interface SendEventsProperties {
  [SendEvents.send_cancel]: undefined
  [SendEvents.send_scan]: undefined
  [SendEvents.send_select_recipient]: {
    recipientKind: RecipientKind
    usedSearchBar: boolean
  }
  [SendEvents.send_amount_back]: undefined
  [SendEvents.send_continue]: {
    isScan: boolean
    isInvite: boolean
    localCurrencyExchangeRate?: string | null
    localCurrency: LocalCurrencyCode
    dollarAmount: string | null
    localCurrencyAmount: string | null
  }
  [SendEvents.send_confirm_back]: undefined
  [SendEvents.send_confirm]: {
    isScan: boolean
    isInvite: boolean
    localCurrencyExchangeRate?: string | null
    localCurrency: LocalCurrencyCode
    dollarAmount: string | null
    localCurrencyAmount: string | null
  }
  [SendEvents.send_error]: {
    isInvite: boolean
    error: string
  }
  [SendEvents.send_complete]: {
    isInvite: boolean
  }
  [SendEvents.send_dollar_transaction]: undefined
  [SendEvents.send_dollar_transaction_confirmed]: undefined

  [SendEvents.send_secure_start]: {
    confirmByScan: boolean
  }
  [SendEvents.send_secure_cancel]: undefined
  [SendEvents.send_secure_back]: undefined
  [SendEvents.send_secure_submit]: {
    partialAddressValidation: boolean
    address: string
  }
  [SendEvents.send_secure_success]: {
    confirmByScan: boolean
    partialAddressValidation?: boolean
  }
  [SendEvents.send_secure_incorrect]: {
    confirmByScan: boolean
    partialAddressValidation?: boolean
    error: string
  }
  [SendEvents.send_secure_info]: {
    partialAddressValidation: boolean
  }
  [SendEvents.send_secure_info_dismissed]: {
    partialAddressValidation: boolean
  }
  [SendEvents.send_secure_edit]: undefined
}

interface RequestEventsProperties {
  [RequestEvents.request_amount_back]: undefined
  [RequestEvents.request_cancel]: undefined
  [RequestEvents.request_scan]: undefined
  [RequestEvents.request_select_recipient]: {
    recipientKind: RecipientKind
    usedSearchBar: boolean
  }
  [RequestEvents.request_continue]: {
    isScan: boolean
    isInvite: boolean
    localCurrencyExchangeRate?: string | null
    localCurrency: LocalCurrencyCode
    dollarAmount: string | null
    localCurrencyAmount: string | null
  }
  [RequestEvents.request_unavailable]: {
    isScan: boolean
    isInvite: boolean
    localCurrencyExchangeRate?: string | null
    localCurrency: LocalCurrencyCode
    dollarAmount: string | null
    localCurrencyAmount: string | null
  }
  [RequestEvents.request_confirm_back]: undefined
  [RequestEvents.request_confirm]: {
    requesteeAddress: string
  }
  [RequestEvents.request_error]: {
    error: string
  }
}

interface FeeEventsProperties {
  [FeeEvents.fee_rendered]: {
    feeType: string
    fee?: string
  }
  [FeeEvents.estimate_fee_failed]: {
    feeType: string
    error: string
  }
  [FeeEvents.fetch_tobin_tax_failed]: {
    error: string
  }
}

interface TransactionEventsProperties {
  [TransactionEvents.transaction_send_start]: {
    txId: string
  }
  [TransactionEvents.transaction_send_gas_estimated]: {
    txId: string
    duration: number
  }
  [TransactionEvents.transaction_send_gas_hash_received]: {
    txId: string
    duration: number
  }
  [TransactionEvents.transaction_send_gas_receipt]: {
    txId: string
    duration: number
  }
  [TransactionEvents.transaction_error]: {
    txId: string
    duration: number
    error: string
  }
  [TransactionEvents.transaction_exception]: {
    txId: string
    duration: number
    error: string
  }
  [TransactionEvents.transfer_token_error]: {
    error: string
  }
  [TransactionEvents.unexpected_maker_token]: {
    makerToken: CURRENCY_ENUM
  }
}

interface CeloExchangeEventsProperties {
  [CeloExchangeEvents.gold_switch_input_currency]: {
    to: CURRENCY_ENUM
  }
  [CeloExchangeEvents.gold_buy_continue]: {
    localCurrencyAmount: string | null
    goldAmount: string
    inputToken: CURRENCY_ENUM
    goldToDollarExchangeRate: string
  }
  [CeloExchangeEvents.gold_buy_confirm]: {
    localCurrencyAmount: string | null
    goldAmount: string
    inputToken: CURRENCY_ENUM
    goldToDollarExchangeRate: string
  }
  [CeloExchangeEvents.gold_buy_cancel]: undefined
  [CeloExchangeEvents.gold_buy_edit]: undefined
  [CeloExchangeEvents.gold_buy_error]: {
    error: string
  }
  [CeloExchangeEvents.gold_sell_continue]: {
    localCurrencyAmount: string | null
    goldAmount: string
    inputToken: CURRENCY_ENUM
    goldToDollarExchangeRate: string
  }
  [CeloExchangeEvents.gold_sell_confirm]: {
    localCurrencyAmount: string | null
    goldAmount: string
    inputToken: CURRENCY_ENUM
    goldToDollarExchangeRate: string
  }
  [CeloExchangeEvents.gold_sell_cancel]: undefined
  [CeloExchangeEvents.gold_sell_edit]: undefined
  [CeloExchangeEvents.gold_sell_error]: {
    error: string
  }

  [CeloExchangeEvents.fetch_exchange_rate_failed]: {
    error: string
  }
  [CeloExchangeEvents.invalid_exchange_rate]: {
    context: string
  }
  [CeloExchangeEvents.exchange_rate_change_failure]: {
    makerToken: CURRENCY_ENUM
    takerAmount: string
    context: string
  }
  [CeloExchangeEvents.missing_tx_id]: undefined
  [CeloExchangeEvents.exchange_failed]: {
    error: string
  }
  [CeloExchangeEvents.gold_info]: undefined
  [CeloExchangeEvents.gold_buy_start]: undefined
  [CeloExchangeEvents.gold_sell_start]: undefined
  [CeloExchangeEvents.gold_activity_select]: undefined
  [CeloExchangeEvents.gold_activity_back]: undefined
}

interface GethEventsProperties {
  [GethEvents.blockchain_corruption]: undefined
  [GethEvents.geth_init_success]: undefined
  [GethEvents.geth_init_failure]: {
    error: string
    context: string
  }
  [GethEvents.geth_restart_to_fix_init]: undefined
  [GethEvents.prompt_forno]: {
    error: string
    context: string
  }
}

export type AnalyticsPropertiesList = AppEventsProperties &
  SettingsEventsProperties &
  NotificationEventsProperties &
  OnboardingEventsProperties &
  VerificationEventsProperties &
  IdentityEventsProperties &
  IdentityEventsProperties &
  InviteEventsProperties &
  SendEventsProperties &
  EscrowEventsProperties &
  RequestEventsProperties &
  FeeEventsProperties &
  TransactionEventsProperties &
  CeloExchangeEventsProperties &
  GethEventsProperties

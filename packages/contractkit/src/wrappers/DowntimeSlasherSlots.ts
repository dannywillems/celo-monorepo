import { findAddressIndex } from '@celo/utils/lib/address'
import BigNumber from 'bignumber.js'
import { Address } from '../base'
import { DowntimeSlasherSlots } from '../generated/DowntimeSlasherSlots'
import {
  BaseWrapper,
  CeloTransactionObject,
  proxyCall,
  toTransactionObject,
  valueToBigNumber,
  valueToInt,
} from './BaseWrapper'
import { Validator } from './Validators'

export interface DowntimeSlasherSlotsConfig {
  slashableDowntime: number
  slashingIncentives: {
    reward: BigNumber
    penalty: BigNumber
  }
  oncePerEpoch: boolean
}

export interface DowntimeWindow {
  start: number
  end: number
  length: number
}

/**
 * Contract handling slashing for Validator downtime using slots
 */
export class DowntimeSlasherSlotsWrapper extends BaseWrapper<DowntimeSlasherSlots> {
  /**
   * Returns slashing incentives.
   * @return Rewards and penaltys for slashing.
   */
  slashingIncentives = proxyCall(this.contract.methods.slashingIncentives, undefined, (res): {
    reward: BigNumber
    penalty: BigNumber
  } => ({
    reward: valueToBigNumber(res.reward),
    penalty: valueToBigNumber(res.penalty),
  }))

  /**
   * Returns slashable downtime in blocks.
   * @return The number of consecutive blocks before a Validator missing from IBFT consensus
   * can be slashed.
   */
  slashableDowntime = proxyCall(this.contract.methods.slashableDowntime, undefined, valueToInt)

  /**
   * Returns the oncePerEpoch configuration if it's possible to slash the same validator in
   * the same epoch.
   * @returns Boolean that shows it the configuration is enable or disable
   */
  oncePerEpoch = proxyCall(this.contract.methods.oncePerEpoch)

  getEpochSize = proxyCall(this.contract.methods.getEpochSize, undefined, valueToBigNumber)

  /**
   * Returns current configuration parameters.
   */
  async getConfig(): Promise<DowntimeSlasherSlotsConfig> {
    const res = await Promise.all([
      this.slashableDowntime(),
      this.slashingIncentives(),
      this.oncePerEpoch(),
    ])
    return {
      slashableDowntime: res[0],
      slashingIncentives: res[1],
      oncePerEpoch: res[2],
    }
  }

  /**
   * @notice Test if a validator has been down for an specific slot of blocks.
   * If the user already has called the method "generateProofOfSlotValidation", for
   * the same Slot (startBlock, endBlock), it will use those accumulators
   * @param startBlock First block of the downtime.
   * @param endBlock Last block of the downtime slot.
   * @param startSignerIndex Index of the signer within the validator set as of the start block.
   * @param endSignerIndex Index of the signer within the validator set as of the end block.
   * @return True if the validator signature does not appear in any block within the window.
   */
  isDownForSlot = proxyCall(this.contract.methods.isDownForSlot)

  /**
   * @notice Function that will calculate the accumulated (OR) of the up bitmap for an especific
   * Slot (startBlock, endBlock) for all the signers.
   * If in the middle of the Slot, it changes the Epoch, will
   * calculate one accumulator for the interval [startBlock, epochEndBlock] and
   * the other for the interval [nextEpochStartBlock, endBlock]
   * @param startBlock First block of the downtime slot.
   * @param endBlock Last block of the downtime slot.
   * @return up bitmaps accumulators for every signer in the Slot. If in the middle of the Slot
   * the epoch change occurs, the first element will have the accumulator of the first epoch, and
   * the second element, the accumulator of the other epoch.
   * Otherwise, the second element will be zero.
   */
  calculateSlotUpBitmapAccumulators = proxyCall(
    this.contract.methods.calculateSlotUpBitmapAccumulators
  )

  /**
   * Generates and saves a proof of validation for the slot.
   * @param startBlock First block of the downtime.
   * @param endBlock First block of the downtime.
   * @returns up bitmaps accumulators for every signer in the Slot. If in the middle of the Slot
   * the epoch change occurs, the first element will have the accumulator of the first epoch, and
   * the second element, the accumulator of the other epoch.
   * Otherwise, the second element will be zero.
   */
  generateProofOfSlotValidation = proxyCall(this.contract.methods.generateProofOfSlotValidation)

  /**
   * @notice Shows if the user already called the generateProofOfSlotValidation for
   * the specific slot
   * @param startBlock First block of a calculated downtime Slot.
   * @param endBlock Last block of the calculated downtime Slot.
   * @return True if the user already called the generateProofOfSlotValidation for
   * the specific slot
   */
  slotAlreadyCalculated = proxyCall(this.contract.methods.slotAlreadyCalculated)

  /**
   * Tests if the given validator or signer has been down in the slot.
   * @param validatorOrSignerAddress Address of the validator account or signer.
   * @param startBlock First block of the slot.
   * @param endBlock Last block of the slot.
   */
  async isValidatorDownForSlot(
    validatorOrSignerAddress: Address,
    startBlock: number,
    endBlock: number
  ) {
    const startSignerIndex = await this.getValidatorSignerIndex(
      validatorOrSignerAddress,
      startBlock
    )
    const endSignerIndex = await this.getValidatorSignerIndex(validatorOrSignerAddress, endBlock)
    return this.isDownForSlot(startBlock, endBlock, startSignerIndex, endSignerIndex)
  }

  /**
   * Tests if a validator has been down.
   * @param startBlock First block of the downtime.
   * @param startSignerIndex Validator index at the first block.
   * @param endSignerIndex Validator index at the last block.
   */
  isDown = proxyCall(this.contract.methods.isDown)

  /**
   * Tests if the given validator or signer has been down.
   * @param validatorOrSignerAddress Address of the validator account or signer.
   * @param startBlock First block of the downtime, undefined if using endBlock.
   * @param endBlock Last block of the downtime. Determined from startBlock or grandparent of latest block if not provided.
   * @param calculateSlots Default: true. Flag to force the Slot calculations. If it's false, require to have the
   * slots precalculated, otherwise won't validate
   */
  async isValidatorDown(
    validatorOrSignerAddress: Address,
    startBlock: number | undefined,
    endBlock: number | undefined,
    startSlots: number[],
    endSlots: number[]
  ) {
    const window = await this.getSlashableDowntimeWindow(startBlock, endBlock)

    const startSignerIndex = await this.getValidatorSignerIndex(
      validatorOrSignerAddress,
      window.start
    )
    const endSignerIndex = await this.getValidatorSignerIndex(validatorOrSignerAddress, window.end)
    return this.isDown(window.start, startSlots, endSlots, startSignerIndex, endSignerIndex)
  }

  /**
   * Tests if the given validator or signer has been down.
   * @param validatorOrSignerAddress Address of the validator account or signer.
   * @param startBlock First block of the downtime, undefined if using endBlock.
   * @param endBlock Last block of the downtime. Determined from startBlock or grandparent of latest block if not provided.
   * @param calculateSlots Default: true. Flag to force the Slot calculations. If it's false, require to have the
   * slots precalculated, otherwise won't validate
   */
  async isValidatorDownGeneratingProofs(
    validatorOrSignerAddress: Address,
    startBlock: number | undefined,
    endBlock: number | undefined,
    slotSize: number
  ) {
    const window = await this.getSlashableDowntimeWindow(startBlock, endBlock)

    const slotsArrays = await this.generateProofs(window, slotSize)
    const startSignerIndex = await this.getValidatorSignerIndex(
      validatorOrSignerAddress,
      window.start
    )
    const endSignerIndex = await this.getValidatorSignerIndex(validatorOrSignerAddress, window.end)
    return this.isDown(
      window.start,
      slotsArrays.startSlots,
      slotsArrays.endSlots,
      startSignerIndex,
      endSignerIndex
    )
  }

  /**
   * Determines the validator signer given an account or signer address and block number.
   * @param validatorOrSignerAddress Address of the validator account or signer.
   * @param blockNumber Block at which to determine the signer index.
   */
  async getValidatorSignerIndex(validatorOrSignerAddress: Address, blockNumber: number) {
    // If the provided address is the account, fetch the signer at the given block.
    const accounts = await this.kit.contracts.getAccounts()
    const validators = await this.kit.contracts.getValidators()
    const isAccount = await accounts.isAccount(validatorOrSignerAddress)
    const signer = isAccount
      ? (await validators.getValidator(validatorOrSignerAddress, blockNumber)).signer
      : validatorOrSignerAddress

    // Determine the index of the validator signer in the elected set at the given block.
    const election = await this.kit.contracts.getElection()
    const index = findAddressIndex(signer, await election.getValidatorSigners(blockNumber))
    if (index < 0) {
      throw new Error(`Validator signer ${signer} was not elected at block ${blockNumber}`)
    }
    return index
  }

  /**
   * Slash a Validator for downtime.
   * @param validator Validator account or signer to slash for downtime.
   * @param startBlock First block of the downtime, undefined if using endBlock.
   * @param endBlock Last block of the downtime. Determined from startBlock or grandparent of latest block if not provided.
   * @param calculateSlots Default: true. Flag to force the Slot calculations. If it's false,
   * require to have the slots precalculated, otherwise won't validate
   * @param calculateSlotsAsync Default: true. If 'calculatedSlots' set, will wait the
   * previous Slot response (this would save gas if one slot was not down). Otherwise will
   * trigger every slot at the same time (will save time).
   */
  async slashValidator(
    validatorOrSignerAddress: Address,
    startBlock: number | undefined,
    endBlock: number | undefined,
    startSlots: number[],
    endSlots: number[]
  ): Promise<CeloTransactionObject<void>> {
    const window = await this.getSlashableDowntimeWindow(startBlock, endBlock)
    return this.slashEndSignerIndex(
      window.end,
      await this.getValidatorSignerIndex(validatorOrSignerAddress, window.end),
      startSlots,
      endSlots
    )
  }

  /**
   * Slash a Validator for downtime.
   * @param validator Validator account or signer to slash for downtime.
   * @param startBlock First block of the downtime, undefined if using endBlock.
   * @param endBlock Last block of the downtime. Determined from startBlock or grandparent of latest block if not provided.
   * @param calculateSlots Default: true. Flag to force the Slot calculations. If it's false,
   * require to have the slots precalculated, otherwise won't validate
   * @param calculateSlotsAsync Default: true. If 'calculatedSlots' set, will wait the
   * previous Slot response (this would save gas if one slot was not down). Otherwise will
   * trigger every slot at the same time (will save time).
   */
  async slashValidatorGeneratingProofs(
    validatorOrSignerAddress: Address,
    startBlock: number | undefined,
    endBlock: number | undefined,
    slotSize: number
  ): Promise<CeloTransactionObject<void>> {
    const window = await this.getSlashableDowntimeWindow(startBlock, endBlock)
    return this.slashEndSignerIndexGeneratingProofs(
      window.end,
      await this.getValidatorSignerIndex(validatorOrSignerAddress, window.end),
      slotSize
    )
  }

  /**
   * Slash a Validator for downtime.
   * @param startBlock First block of the downtime.
   * @param startSignerIndex Validator index at the first block.
   * @param calculateSlots Default: true. Flag to force the Slot calculations. If it's false,
   * require to have the slots precalculated, otherwise won't validate
   * @param calculateSlotsAsync Default: true. If 'calculatedSlots' set, will wait the
   * previous Slot response (this would save gas if one slot was not down). Otherwise will
   * trigger every slot at the same time (will save time).
   */
  async slashStartSignerIndex(
    startBlock: number,
    startSignerIndex: number,
    startSlots: number[],
    endSlots: number[]
  ): Promise<CeloTransactionObject<void>> {
    const election = await this.kit.contracts.getElection()
    const validators = await this.kit.contracts.getValidators()
    const signer = await election.validatorSignerAddressFromSet(startSignerIndex, startBlock)
    const startEpoch = await this.kit.getEpochNumberOfBlock(startBlock)
    // Follows DowntimeSlasher.getEndBlock()
    const window = await this.getSlashableDowntimeWindow(startBlock)
    const endEpoch = await this.kit.getEpochNumberOfBlock(window.end)
    const endSignerIndex =
      startEpoch === endEpoch
        ? startSignerIndex
        : findAddressIndex(signer, await election.getValidatorSigners(window.end))
    const validator = await validators.getValidatorFromSigner(signer)
    return this.slash(validator, window, startSlots, endSlots, startSignerIndex, endSignerIndex)
  }

  /**
   * Slash a Validator for downtime.
   * @param startBlock First block of the downtime.
   * @param startSignerIndex Validator index at the first block.
   * @param calculateSlots Default: true. Flag to force the Slot calculations. If it's false,
   * require to have the slots precalculated, otherwise won't validate
   * @param calculateSlotsAsync Default: true. If 'calculatedSlots' set, will wait the
   * previous Slot response (this would save gas if one slot was not down). Otherwise will
   * trigger every slot at the same time (will save time).
   */
  async slashStartSignerIndexGeneratingProofs(
    startBlock: number,
    startSignerIndex: number,
    slotSize: number
  ): Promise<CeloTransactionObject<void>> {
    const election = await this.kit.contracts.getElection()
    const validators = await this.kit.contracts.getValidators()
    const signer = await election.validatorSignerAddressFromSet(startSignerIndex, startBlock)
    const startEpoch = await this.kit.getEpochNumberOfBlock(startBlock)
    // Follows DowntimeSlasher.getEndBlock()
    const window = await this.getSlashableDowntimeWindow(startBlock)
    const endEpoch = await this.kit.getEpochNumberOfBlock(window.end)
    const endSignerIndex =
      startEpoch === endEpoch
        ? startSignerIndex
        : findAddressIndex(signer, await election.getValidatorSigners(window.end))
    const validator = await validators.getValidatorFromSigner(signer)
    return this.slashGeneratingProofs(validator, window, slotSize, startSignerIndex, endSignerIndex)
  }

  /**
   * Slash a Validator for downtime.
   * @param endBlock The last block of the downtime to slash for.
   * @param endSignerIndex Validator index at the last block.
   * @param calculateSlots Default: true. Flag to force the Slot calculations. If it's false,
   * require to have the slots precalculated, otherwise won't validate
   * @param calculateSlotsAsync Default: true. If 'calculatedSlots' set, will wait the
   * previous Slot response (this would save gas if one slot was not down). Otherwise will
   * trigger every slot at the same time (will save time).
   */
  async slashEndSignerIndex(
    endBlock: number,
    endSignerIndex: number,
    startSlots: number[],
    endSlots: number[]
  ): Promise<CeloTransactionObject<void>> {
    const election = await this.kit.contracts.getElection()
    const validators = await this.kit.contracts.getValidators()
    const signer = await election.validatorSignerAddressFromSet(endSignerIndex, endBlock)
    const endEpoch = await this.kit.getEpochNumberOfBlock(endBlock)
    // Reverses DowntimeSlasher.getEndBlock()
    const slashableWindow = await this.getSlashableDowntimeWindow(undefined, endBlock)
    const startEpoch = await this.kit.getEpochNumberOfBlock(slashableWindow.start)
    const startSignerIndex =
      startEpoch === endEpoch
        ? endSignerIndex
        : findAddressIndex(signer, await election.getValidatorSigners(slashableWindow.start))
    const validator = await validators.getValidatorFromSigner(signer)
    return this.slash(
      validator,
      slashableWindow,
      startSlots,
      endSlots,
      startSignerIndex,
      endSignerIndex
    )
  }

  /**
   * Slash a Validator for downtime.
   * @param endBlock The last block of the downtime to slash for.
   * @param endSignerIndex Validator index at the last block.
   * @param calculateSlots Default: true. Flag to force the Slot calculations. If it's false,
   * require to have the slots precalculated, otherwise won't validate
   * @param calculateSlotsAsync Default: true. If 'calculatedSlots' set, will wait the
   * previous Slot response (this would save gas if one slot was not down). Otherwise will
   * trigger every slot at the same time (will save time).
   */
  async slashEndSignerIndexGeneratingProofs(
    endBlock: number,
    endSignerIndex: number,
    slotSize: number
  ): Promise<CeloTransactionObject<void>> {
    const election = await this.kit.contracts.getElection()
    const validators = await this.kit.contracts.getValidators()
    const signer = await election.validatorSignerAddressFromSet(endSignerIndex, endBlock)
    const endEpoch = await this.kit.getEpochNumberOfBlock(endBlock)
    // Reverses DowntimeSlasher.getEndBlock()
    const slashableWindow = await this.getSlashableDowntimeWindow(undefined, endBlock)
    const startEpoch = await this.kit.getEpochNumberOfBlock(slashableWindow.start)
    const startSignerIndex =
      startEpoch === endEpoch
        ? endSignerIndex
        : findAddressIndex(signer, await election.getValidatorSigners(slashableWindow.start))
    const validator = await validators.getValidatorFromSigner(signer)
    return this.slashGeneratingProofs(
      validator,
      slashableWindow,
      slotSize,
      startSignerIndex,
      endSignerIndex
    )
  }

  /**
   * Slash a Validator for downtime.
   * @param validator Validator to slash for downtime.
   * @param startBlock First block of the downtime.
   * @param startSlots Array of the block numbers of the slot's start
   * @param endSlots Array of the block numbers of the slot's end
   * @param startSignerIndex Validator index at the first block.
   * @param endSignerIndex Validator index at the last block.
   */
  private async slash(
    validator: Validator,
    slashableWindow: DowntimeWindow,
    startSlots: number[],
    endSlots: number[],
    startSignerIndex: number,
    endSignerIndex: number
  ): Promise<CeloTransactionObject<void>> {
    const incentives = await this.slashingIncentives()
    const validators = await this.kit.contracts.getValidators()
    const membership = await validators.getValidatorMembershipHistoryIndex(
      validator,
      slashableWindow.start
    )
    const lockedGold = await this.kit.contracts.getLockedGold()
    const slashValidator = await lockedGold.computeInitialParametersForSlashing(
      validator.address,
      incentives.penalty
    )
    const slashGroup = await lockedGold.computeParametersForSlashing(
      membership.group,
      incentives.penalty,
      slashValidator.list
    )

    return toTransactionObject(
      this.kit,
      this.contract.methods.slash(
        slashableWindow.start,
        startSlots,
        endSlots,
        startSignerIndex,
        endSignerIndex,
        membership.historyIndex,
        slashValidator.lessers,
        slashValidator.greaters,
        slashValidator.indices,
        slashGroup.lessers,
        slashGroup.greaters,
        slashGroup.indices
      )
    )
  }

  private async generateProofs(
    slashableWindow: DowntimeWindow,
    slotSize: number
  ): Promise<{ startSlots: number[]; endSlots: number[] }> {
    const startSlots: number[] = []
    const endSlots: number[] = []

    if (slotSize <= 1) {
      throw new Error('Slot size must be bigger than 1')
    }
    for (let i = slashableWindow.start; i < slashableWindow.end; i += slotSize) {
      const start = i
      const end = i + slotSize - 1 > slashableWindow.end ? slashableWindow.end : i + slotSize - 1
      startSlots.push(start)
      endSlots.push(end)
      await this.contract.methods.generateProofOfSlotValidation(start, end).send()
    }

    return { startSlots, endSlots }
  }

  private async slashGeneratingProofs(
    validator: Validator,
    slashableWindow: DowntimeWindow,
    slotSize: number,
    startSignerIndex: number,
    endSignerIndex: number
  ): Promise<CeloTransactionObject<void>> {
    const slotArrays = await this.generateProofs(slashableWindow, slotSize)

    return this.slash(
      validator,
      slashableWindow,
      slotArrays.startSlots,
      slotArrays.endSlots,
      startSignerIndex,
      endSignerIndex
    )
  }

  /**
   * Calculate the slashable window with respect to a provided start or end block number.
   * @param startBlock First block of the downtime. Determined from endBlock if not provided.
   * @param endBlock Last block of the downtime. Determined from startBlock or grandparent of latest block if not provided.
   */
  private async getSlashableDowntimeWindow(
    startBlock?: number,
    endBlock?: number
  ): Promise<DowntimeWindow> {
    const length = await this.slashableDowntime()
    return this.getDowntimeWindow(length, startBlock, endBlock)
  }

  /**
   * Calculate the downtime window with respect to a length and a provided start or end block number.
   * @param length Window length
   * @param startBlock First block of the slot. Determined from endBlock if not provided.
   * @param endBlock Last block of the slot. Determined from startBlock or grandparent of latest block if not provided.
   */
  private async getDowntimeWindow(
    length: number,
    startBlock?: number,
    endBlock?: number
  ): Promise<DowntimeWindow> {
    if (startBlock !== undefined && endBlock !== undefined) {
      if (endBlock - startBlock + 1 !== length) {
        throw new Error(`Start and end block must define a window of ${length} blocks`)
      }
      return {
        start: startBlock,
        end: endBlock,
        length,
      }
    }
    if (endBlock !== undefined) {
      return {
        start: endBlock - length + 1,
        end: endBlock,
        length,
      }
    }
    if (startBlock !== undefined) {
      return {
        start: startBlock,
        end: startBlock + length - 1,
        length,
      }
    }

    // Use the latest grandparent because that is the most recent block eligible for inclusion.
    const latest = (await this.kit.web3.eth.getBlockNumber()) - 2
    return {
      start: latest - length + 1,
      end: latest,
      length,
    }
  }
}
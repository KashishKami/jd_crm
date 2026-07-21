import * as callDispositionRepository from '../repository/callDisposition.repository';
import { hasPermission } from './permission.service';
import { formatPhoneNumber } from '../lib/formatPhone';
import {
  CallDispositionCreateInput,
  CallDispositionUpdateInput,
  CallDispositionFilters,
  CallDispositionListResult,
  CallDispositionRecord,
  DISPOSITION_OPTIONS,
} from '../types/callDisposition';

type SessionUser = {
  id: string | number;
  nickname?: string | null;
  name?: string | null;
  teamId?: string | number | null;
  userPermissions: string | null | undefined;
};

export async function getAllDispositions(
  sessionUser: SessionUser,
  rawFilters: CallDispositionFilters
): Promise<CallDispositionListResult> {
  const isViewAll = hasPermission(sessionUser.userPermissions, 'call-dispositions:view');
  const isCreateOwn = hasPermission(sessionUser.userPermissions, 'call-dispositions:create');

  if (!isViewAll && !isCreateOwn) {
    throw new Error('Forbidden: Insufficient Permissions');
  }

  const filters: CallDispositionFilters = { ...rawFilters };

  // Agent-level: always force scope to own records, ignore any client-sent agentId/teamId
  if (!isViewAll) {
    filters.agentId = Number(sessionUser.id);
    delete filters.teamId;
  }

  return callDispositionRepository.findAll(filters);
}

export async function getDispositionById(
  sessionUser: SessionUser,
  id: number
): Promise<CallDispositionRecord | null> {
  const isViewAll = hasPermission(sessionUser.userPermissions, 'call-dispositions:view');
  const isCreateOwn = hasPermission(sessionUser.userPermissions, 'call-dispositions:create');

  if (!isViewAll && !isCreateOwn) {
    throw new Error('Forbidden: Insufficient Permissions');
  }

  const record = await callDispositionRepository.findById(id);
  if (!record) return null;

  // Agent-level: must own the record to view it
  if (!isViewAll && record.agentId !== Number(sessionUser.id)) {
    throw new Error('Forbidden: Insufficient Permissions');
  }

  return record;
}

export async function createDisposition(
  sessionUser: SessionUser,
  data: CallDispositionCreateInput
) {
  const isCreateOwn = hasPermission(sessionUser.userPermissions, 'call-dispositions:create');
  if (!isCreateOwn) {
    throw new Error('Forbidden: Insufficient Permissions');
  }

  // Validate required fields
  if (!data.customerPhone || data.customerPhone.trim() === '') {
    throw new Error('Bad Request: customerPhone is required');
  }
  if (!data.disposition || data.disposition.trim() === '') {
    throw new Error('Bad Request: disposition is required');
  }
  if (!(DISPOSITION_OPTIONS as readonly string[]).includes(data.disposition)) {
    throw new Error(`Bad Request: disposition must be one of: ${DISPOSITION_OPTIONS.join(', ')}`);
  }

  // Format phone number to xxx-xxx-xxxx
  const formattedPhone = formatPhoneNumber(data.customerPhone);

  const agentName = sessionUser.nickname || sessionUser.name || 'Unknown';
  const agentId = Number(sessionUser.id);
  const teamId = Number(sessionUser.teamId) || 0;

  return callDispositionRepository.create({
    customerPhone: formattedPhone,
    customerName: data.customerName || null,
    agentId,
    agentName,
    teamId,
    disposition: data.disposition,
  });
}

export async function updateDisposition(
  sessionUser: SessionUser,
  id: number,
  data: CallDispositionUpdateInput
) {
  // getDispositionById handles permission check and ownership enforcement
  const existing = await getDispositionById(sessionUser, id);
  if (!existing) {
    throw new Error('Not Found: Disposition record not found');
  }

  const updateData: CallDispositionUpdateInput = {};
  if (data.customerPhone !== undefined) {
    updateData.customerPhone = formatPhoneNumber(data.customerPhone);
  }
  if (data.customerName !== undefined) {
    updateData.customerName = data.customerName || null;
  }
  if (data.disposition !== undefined) {
    if (!(DISPOSITION_OPTIONS as readonly string[]).includes(data.disposition)) {
      throw new Error(`Bad Request: disposition must be one of: ${DISPOSITION_OPTIONS.join(', ')}`);
    }
    updateData.disposition = data.disposition;
  }

  return callDispositionRepository.update(id, updateData);
}

export async function deleteDisposition(
  sessionUser: SessionUser,
  id: number
) {
  const isViewAll = hasPermission(sessionUser.userPermissions, 'call-dispositions:view');
  if (!isViewAll) {
    throw new Error('Forbidden: Insufficient Permissions');
  }

  const existing = await callDispositionRepository.findById(id);
  if (!existing) {
    throw new Error('Not Found: Disposition record not found');
  }

  return callDispositionRepository.remove(id);
}

export async function getAllDispositionsForExport(
  sessionUser: SessionUser,
  rawFilters: CallDispositionFilters
): Promise<CallDispositionRecord[]> {
  const isViewAll = hasPermission(sessionUser.userPermissions, 'call-dispositions:view');
  if (!isViewAll) {
    throw new Error('Forbidden: Insufficient Permissions');
  }

  const filters: CallDispositionFilters = { ...rawFilters };
  delete filters.page;
  delete filters.limit;

  return callDispositionRepository.findAll_noLimit(filters);
}

import * as gatewayRepository from '../repository/gateway.repository';
import { GatewayCreateInput, GatewayUpdateInput, GatewayMonthlyReport } from '../types/gateway';

export async function getAllGateways(status?: number) {
  return gatewayRepository.findAll(status);
}

export async function getGatewayById(gatewayId: number) {
  return gatewayRepository.findById(gatewayId);
}

export async function createGateway(data: GatewayCreateInput) {
  const now = new Date();
  return gatewayRepository.create({
    gatewayName: data.gatewayName,
    gatewayStatus: data.gatewayStatus ?? 1,
    gatewayCreatedAt: now,
    gatewayUpdatedAt: now,
  });
}

export async function updateGateway(gatewayId: number, data: GatewayUpdateInput) {
  return gatewayRepository.update(gatewayId, {
    ...data,
    gatewayUpdatedAt: new Date(),
  });
}

/**
 * Fetches the raw monthly rows from the repository and enriches each entry
 * with a computed netAmount = completedAmount - refundAmount - chargebackAmount.
 */
export async function computeReport(gatewayId: number): Promise<GatewayMonthlyReport[]> {
  const rows = await gatewayRepository.getMonthlyReport(gatewayId);

  return rows.map((row) => ({
    ...row,
    netAmount:
      row.completedAmount - row.refundAmount - row.chargebackAmount,
  }));
}

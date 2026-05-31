import ShippingService from '../ShippingService';

describe('ShippingService - calculateShipping & distance calc', () => {
  const svc = new ShippingService({} as any);

  test('Coordenadas (3,4) -> distancia 5 km -> tarifa media', () => {
    const r = svc.calculateShipping({ x: 3, y: 4, zone: '' } as any);
    expect(r.distance).toBe(5);
    expect(r.available).toBe(true);
    expect(r.price).toBe(10000);
    expect(r.status).toBe('available');
  });

  test('Zona CENTRO -> disponible y tarifa corta', () => {
    const r = svc.calculateShipping({ zone: 'CENTRO', x: 0, y: 0 } as any);
    expect(r.available).toBe(true);
    expect(r.price).toBe(5000);
  });

  test('Zona SUR -> fuera de alcance', () => {
    const r = svc.calculateShipping({ zone: 'SUR', x: 0, y: 0 } as any);
    expect(r.available).toBe(false);
    expect(r.error).toBe('DISTANCE_EXCEEDED');
  });

  test('Sin coordenadas ni zona -> error MISSING_LOCATION', () => {
    const r = svc.calculateShipping({} as any);
    expect(r.error).toBe('MISSING_LOCATION');
  });
});

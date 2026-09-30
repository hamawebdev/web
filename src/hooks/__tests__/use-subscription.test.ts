import { selectEffectiveActiveSubscription } from '../use-subscription';

describe('selectEffectiveActiveSubscription', () => {
  const now = new Date();
  const futureDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

  describe('Residency detection for yearNumber = SEVEN', () => {
    it('treats a YEAR pack with yearNumber=SEVEN as an ordinary year pack, not résidanat', () => {
      const subscriptions = [
        {
          id: 553,
          status: 'ACTIVE',
          startDate: now.toISOString(),
          endDate: futureDate.toISOString(),
          amountPaid: 0,
          paymentMethod: 'ACTIVATION_CODE',
          studyPack: {
            id: 7,
            name: 'Résidanat',
            description: 'Pack spécialisé pour la préparation au résidanat',
            type: 'YEAR',
            yearNumber: 'SEVEN',
            pricePerMonth: '990',
            pricePerYear: '5500',
            statistics: {
              totalCourses: 0,
              totalModules: 0,
              totalUnites: 0
            }
          },
          isActive: true,
          daysRemaining: 31,
          createdAt: now.toISOString()
        }
      ];

      const result = selectEffectiveActiveSubscription(subscriptions);

      expect(result.isResidency).toBe(false);
      expect(result.allowedYearLevels).toEqual(['SEVEN']);
      expect(result.effective).toBeDefined();
      expect(result.effective?.studyPack?.yearNumber).toBe('SEVEN');
    });

    it('should recognize explicit RESIDENCY type as residency', () => {
      const subscriptions = [
        {
          id: 554,
          status: 'ACTIVE',
          startDate: now.toISOString(),
          endDate: futureDate.toISOString(),
          studyPack: {
            id: 8,
            name: 'Residency Pack',
            type: 'RESIDENCY',
            yearNumber: 'SEVEN'
          },
          isActive: true,
          createdAt: now.toISOString()
        }
      ];

      const result = selectEffectiveActiveSubscription(subscriptions);

      expect(result.isResidency).toBe(true);
      expect(result.allowedYearLevels).toEqual(['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN']);
    });

    it('should not treat non-SEVEN year subscriptions as residency', () => {
      const subscriptions = [
        {
          id: 555,
          status: 'ACTIVE',
          startDate: now.toISOString(),
          endDate: futureDate.toISOString(),
          studyPack: {
            id: 9,
            name: 'Year 6 Pack',
            type: 'YEAR',
            yearNumber: 'SIX'
          },
          isActive: true,
          createdAt: now.toISOString()
        }
      ];

      const result = selectEffectiveActiveSubscription(subscriptions);

      expect(result.isResidency).toBe(false);
      expect(result.allowedYearLevels).toEqual(['SIX']);
    });

    it('should handle expired subscriptions correctly', () => {
      const pastDate = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000); // 1 day ago

      const subscriptions = [
        {
          id: 556,
          status: 'ACTIVE',
          startDate: now.toISOString(),
          endDate: pastDate.toISOString(), // Expired
          studyPack: {
            id: 10,
            name: 'Résidanat',
            type: 'YEAR',
            yearNumber: 'SEVEN'
          },
          isActive: false,
          createdAt: now.toISOString()
        }
      ];

      const result = selectEffectiveActiveSubscription(subscriptions);

      expect(result.isResidency).toBe(false);
      expect(result.effective).toBeNull();
    });

    it('should prioritize residency over non-residency subscriptions', () => {
      const subscriptions = [
        {
          id: 557,
          status: 'ACTIVE',
          startDate: now.toISOString(),
          endDate: futureDate.toISOString(),
          studyPack: {
            id: 11,
            name: 'Year 5 Pack',
            type: 'YEAR',
            yearNumber: 'FIVE'
          },
          isActive: true,
          createdAt: now.toISOString()
        },
        {
          id: 558,
          status: 'ACTIVE',
          startDate: now.toISOString(),
          endDate: futureDate.toISOString(),
          studyPack: {
            id: 12,
            name: 'Résidanat',
            type: 'YEAR',
            yearNumber: 'SEVEN'
          },
          isActive: true,
          createdAt: now.toISOString()
        }
      ];

      const result = selectEffectiveActiveSubscription(subscriptions);

      expect(result.isResidency).toBe(true);
      expect(result.allowedYearLevels).toEqual(['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN']);
      expect(result.effective?.studyPack?.yearNumber).toBe('SEVEN');
    });
  });
});


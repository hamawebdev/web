// @ts-nocheck
import { StudyPack } from '@/types/api';
import { PricingMode } from '@/components/ui/pricing-toggle';

export interface TransformedStudyPack {
  id: number;
  title: string;
  description: string;
  price: string;
  priceValue: number;
  features: string[];
  popular: boolean;
  gradient: string;
  type: string;
  yearNumber?: string;
  originalPack: StudyPack;
}

/**
 * Transform API study pack data into format suitable for homepage display
 */
export function transformStudyPacksForHomepage(
  studyPacks: StudyPack[],
  pricingMode: PricingMode
): TransformedStudyPack[] {
  return studyPacks.map((pack, index) => {
    // Determine price based on mode
    const priceValue = pricingMode === 'YEAR'
      ? parseInt(pack.pricePerYear || '0')
      : parseInt(pack.pricePerMonth || '0');

    const priceText = `${priceValue.toLocaleString()} DA`;

    // Generate features based on statistics
    const features = generateFeatures(pack);

    // Determine if this pack should be marked as popular
    // Mark residency packs or packs with high subscriber count as popular
    const isPopular = pack.type === 'RESIDENCY' ||
      pack.type === 'residency' ||
      (pack.statistics?.subscribersCount || 0) > 10;

    return {
      id: pack.id,
      title: pack.name,
      description: pack.description,
      price: priceText,
      priceValue,
      features,
      popular: isPopular,
      gradient: 'from-primary to-primary',
      type: pack.type,
      yearNumber: pack.yearNumber,
      originalPack: pack,
    };
  });
}

/**
 * Generate feature list based on study pack statistics
 */
function generateFeatures(pack: StudyPack): string[] {
  const features: string[] = [];

  if (pack.statistics) {
    if (pack.statistics.totalCourses > 0) {
      features.push(`${pack.statistics.totalCourses} Courses`);
    }
    if (pack.statistics.totalModules > 0) {
      features.push(`${pack.statistics.totalModules} Modules`);
    }
    if (pack.statistics.totalQuestions > 0) {
      features.push(`${pack.statistics.totalQuestions} Questions`);
    }
    if (pack.statistics.totalQuizzes > 0) {
      features.push(`${pack.statistics.totalQuizzes} Quiz`);
    }
  }

  // Add standard features
  features.push('24/7 Access');
  features.push('Mobile Support');
  features.push('Progress Tracking');

  return features;
}

/**
 * Sort study packs for optimal display order
 */
export function sortStudyPacksForDisplay(packs: TransformedStudyPack[]): TransformedStudyPack[] {
  return [...packs].sort((a, b) => {
    // Prioritize popular packs
    if (a.popular && !b.popular) return -1;
    if (!a.popular && b.popular) return 1;

    // Then sort by type (residency first, then by year)
    if (a.type === 'RESIDENCY' && b.type !== 'RESIDENCY') return -1;
    if (a.type !== 'RESIDENCY' && b.type === 'RESIDENCY') return 1;

    // Sort by year number for year-based packs
    if (a.yearNumber && b.yearNumber) {
      const yearOrder = ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN'];
      const aIndex = yearOrder.indexOf(a.yearNumber);
      const bIndex = yearOrder.indexOf(b.yearNumber);
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      }
    }

    // Finally sort by price
    return a.priceValue - b.priceValue;
  });
}

/**
 * Get display icon/number for study pack card
 */
export function getStudyPackDisplayIcon(pack: TransformedStudyPack): string | number {
  if (pack.type === 'RESIDENCY' || pack.type === 'residency') {
    return 'R';
  }

  if (pack.yearNumber) {
    const yearMap: Record<string, number> = {
      'ONE': 1,
      'TWO': 2,
      'THREE': 3,
      'FOUR': 4,
      'FIVE': 5,
      'SIX': 6,
      'SEVEN': 7,
    };
    return yearMap[pack.yearNumber] || pack.yearNumber;
  }

  return '?';
}

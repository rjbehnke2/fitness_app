import { NextResponse } from 'next/server';
import { NutritionAdvice } from '@/types/database';

interface NutritionRequest {
  workoutType: 'strength' | 'cardio' | 'mixed';
  workoutDuration: number;
  timeOfDay: 'morning' | 'afternoon' | 'evening';
  fitnessGoal: 'muscle_gain' | 'fat_loss' | 'maintenance';
}

export async function POST(request: Request) {
  try {
    const { workoutType, workoutDuration, timeOfDay, fitnessGoal } = await request.json() as NutritionRequest;

    // Pre-workout nutrition based on time of day and workout type
    const preWorkout = generatePreWorkoutAdvice(workoutType, timeOfDay, fitnessGoal);

    // Post-workout nutrition based on workout type and goals
    const postWorkout = generatePostWorkoutAdvice(workoutType, workoutDuration, fitnessGoal);

    // General tips based on goals
    const generalTips = generateGeneralTips(fitnessGoal, workoutType);

    const advice: NutritionAdvice = {
      pre_workout: preWorkout,
      post_workout: postWorkout,
      general_tips: generalTips,
    };

    return NextResponse.json(advice);
  } catch (error) {
    console.error('Error generating nutrition advice:', error);
    return NextResponse.json(
      { error: 'Failed to generate nutrition advice' },
      { status: 500 }
    );
  }
}

function generatePreWorkoutAdvice(
  workoutType: string,
  timeOfDay: string,
  fitnessGoal: string
): NutritionAdvice['pre_workout'] {
  const timing = timeOfDay === 'morning'
    ? '30-60 minutes before your workout'
    : '1-2 hours before your workout';

  let foods: string[] = [];
  let hydration = 'Drink 16-20 oz of water 2-3 hours before, then 8 oz 20-30 minutes before.';

  if (timeOfDay === 'morning') {
    if (workoutType === 'strength') {
      foods = [
        'Banana with a tablespoon of almond butter',
        'Greek yogurt with a handful of berries',
        'Oatmeal with honey and sliced banana',
        'Whole grain toast with peanut butter',
      ];
    } else {
      foods = [
        'Small banana or apple',
        'Rice cake with honey',
        'Small smoothie with fruit and milk',
        'Toast with jam',
      ];
    }
  } else {
    if (workoutType === 'strength') {
      foods = [
        'Chicken breast with rice (small portion)',
        'Turkey and cheese sandwich on whole grain bread',
        'Greek yogurt parfait with granola',
        'Eggs with toast and avocado',
      ];
      if (fitnessGoal === 'muscle_gain') {
        foods.push('Protein shake with a banana');
      }
    } else {
      foods = [
        'Apple with almond butter',
        'Trail mix (small handful)',
        'Banana and a small handful of nuts',
        'Energy bar with whole food ingredients',
      ];
    }
  }

  if (fitnessGoal === 'fat_loss') {
    hydration += ' Consider black coffee or green tea for an energy boost without calories.';
  }

  return { timing, foods, hydration };
}

function generatePostWorkoutAdvice(
  workoutType: string,
  workoutDuration: number,
  fitnessGoal: string
): NutritionAdvice['post_workout'] {
  const timing = 'Within 30-60 minutes after your workout (the "anabolic window")';

  let foods: string[] = [];
  let hydration = 'Drink 16-24 oz of water. Replace electrolytes if you sweated heavily.';
  let supplements: string[] = [];

  if (workoutType === 'strength' || workoutType === 'mixed') {
    foods = [
      'Grilled chicken with sweet potato and vegetables',
      'Salmon with quinoa and steamed broccoli',
      'Lean beef stir-fry with brown rice',
      'Greek yogurt with berries and granola',
      'Protein smoothie with banana, milk, and peanut butter',
    ];

    if (fitnessGoal === 'muscle_gain') {
      foods.push('Cottage cheese with pineapple');
      foods.push('Eggs with whole grain toast and avocado');
      supplements = [
        'Whey or plant-based protein shake (20-40g protein)',
        'Creatine monohydrate (5g) if you choose to supplement',
      ];
    } else if (fitnessGoal === 'fat_loss') {
      foods = [
        'Grilled chicken salad with olive oil dressing',
        'Egg white omelette with vegetables',
        'Protein shake with water and berries',
        'Turkey lettuce wraps with hummus',
      ];
      supplements = ['Whey protein shake with water (25-30g protein)'];
    }
  } else {
    // Cardio focused
    foods = [
      'Chocolate milk (natural recovery drink)',
      'Banana with peanut butter on toast',
      'Fruit smoothie with protein powder',
      'Oatmeal with protein powder mixed in',
    ];

    if (workoutDuration > 45) {
      hydration += ' Consider a sports drink to replace glycogen and electrolytes.';
    }
  }

  return { timing, foods, hydration, supplements: supplements.length > 0 ? supplements : undefined };
}

function generateGeneralTips(fitnessGoal: string, workoutType: string): string[] {
  const tips: string[] = [
    'Stay consistent with your nutrition - it\'s just as important as your workouts.',
    'Prioritize whole, unprocessed foods for the majority of your diet.',
    'Get adequate sleep (7-9 hours) for optimal recovery and muscle growth.',
  ];

  if (fitnessGoal === 'muscle_gain') {
    tips.push('Aim for 0.8-1g of protein per pound of body weight daily.');
    tips.push('Eat in a slight caloric surplus (300-500 calories above maintenance).');
    tips.push('Include protein in every meal to maximize muscle protein synthesis.');
    tips.push('Don\'t neglect carbohydrates - they fuel your workouts and recovery.');
  } else if (fitnessGoal === 'fat_loss') {
    tips.push('Maintain a moderate caloric deficit (300-500 calories below maintenance).');
    tips.push('Keep protein high (1g per pound of body weight) to preserve muscle.');
    tips.push('Fill up on vegetables and fiber to stay satiated.');
    tips.push('Avoid drinking your calories - stick to water, tea, and black coffee.');
  } else {
    tips.push('Balance your macronutrients: ~30% protein, ~40% carbs, ~30% fat.');
    tips.push('Listen to your hunger cues and eat mindfully.');
  }

  if (workoutType === 'strength') {
    tips.push('Timing your largest meal around your workout can optimize performance and recovery.');
  }

  return tips;
}

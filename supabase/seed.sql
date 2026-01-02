-- Seed data for the fitness tracking app
-- This populates the exercises table with common exercises

INSERT INTO exercises (name, category, muscle_groups, equipment_required, is_benchmark, description) VALUES
-- Benchmark exercises (main lifts to track)
('Bench Press', 'compound', ARRAY['chest', 'triceps', 'shoulders'], ARRAY['barbell', 'bench'], true, 'Classic chest exercise. Lie on bench, lower bar to chest, press up.'),
('Squat', 'compound', ARRAY['quads', 'glutes', 'hamstrings', 'core'], ARRAY['barbell', 'squat_rack'], true, 'King of leg exercises. Bar on upper back, squat down until thighs parallel, stand up.'),
('Deadlift', 'compound', ARRAY['back', 'hamstrings', 'glutes', 'core'], ARRAY['barbell'], true, 'Full body pull from floor. Hinge at hips, grip bar, stand up straight.'),
('Overhead Press', 'compound', ARRAY['shoulders', 'triceps', 'core'], ARRAY['barbell'], true, 'Standing shoulder press. Bar at shoulders, press overhead, control down.'),
('Barbell Curl', 'strength', ARRAY['biceps', 'forearms'], ARRAY['barbell'], true, 'Classic bicep builder. Stand tall, curl bar to shoulders, control down.'),
('Barbell Row', 'compound', ARRAY['back', 'biceps', 'core'], ARRAY['barbell'], true, 'Back builder. Hinge forward, row bar to lower chest, control down.'),

-- Additional gym exercises
('Incline Bench Press', 'compound', ARRAY['chest', 'shoulders', 'triceps'], ARRAY['barbell', 'bench'], false, 'Upper chest focus. Bench at 30-45 degrees, press similar to flat bench.'),
('Dumbbell Bench Press', 'compound', ARRAY['chest', 'triceps', 'shoulders'], ARRAY['dumbbells', 'bench'], false, 'Greater range of motion than barbell. Independent arm movement.'),
('Dumbbell Shoulder Press', 'compound', ARRAY['shoulders', 'triceps'], ARRAY['dumbbells'], false, 'Seated or standing. Press dumbbells overhead from shoulder height.'),
('Lat Pulldown', 'compound', ARRAY['back', 'biceps'], ARRAY['cable_machine'], false, 'Pull bar to upper chest, squeeze lats at bottom.'),
('Cable Row', 'compound', ARRAY['back', 'biceps'], ARRAY['cable_machine'], false, 'Seated row. Pull handle to lower chest, squeeze back.'),
('Tricep Pushdown', 'strength', ARRAY['triceps'], ARRAY['cable_machine'], false, 'Push bar/rope down, keeping elbows at sides.'),
('Cable Curl', 'strength', ARRAY['biceps'], ARRAY['cable_machine'], false, 'Constant tension curl using cable machine.'),
('Leg Press', 'compound', ARRAY['quads', 'glutes', 'hamstrings'], ARRAY['leg_press'], false, 'Push platform away using legs. Control the negative.'),
('Leg Extension', 'strength', ARRAY['quads'], ARRAY['leg_extension'], false, 'Isolate quads. Extend legs fully, control down.'),
('Leg Curl', 'strength', ARRAY['hamstrings'], ARRAY['leg_curl'], false, 'Isolate hamstrings. Curl heels toward glutes.'),
('Calf Raise', 'strength', ARRAY['calves'], ARRAY['calf_raise_machine'], false, 'Rise up on toes, full stretch at bottom.'),
('Pull-ups', 'compound', ARRAY['back', 'biceps', 'core'], ARRAY['pull_up_bar'], false, 'Hang from bar, pull chest to bar, control down.'),
('Chin-ups', 'compound', ARRAY['back', 'biceps'], ARRAY['pull_up_bar'], false, 'Underhand grip pull-up. More bicep emphasis.'),
('Dips', 'compound', ARRAY['chest', 'triceps', 'shoulders'], ARRAY['dip_bars'], false, 'Lower body between bars, press back up.'),
('Face Pull', 'strength', ARRAY['shoulders', 'back'], ARRAY['cable_machine'], false, 'Pull rope to face, external rotate at end.'),
('Lateral Raise', 'strength', ARRAY['shoulders'], ARRAY['dumbbells'], false, 'Raise dumbbells to sides until shoulder height.'),
('Dumbbell Curl', 'strength', ARRAY['biceps'], ARRAY['dumbbells'], false, 'Alternating or simultaneous dumbbell curls.'),
('Hammer Curl', 'strength', ARRAY['biceps', 'forearms'], ARRAY['dumbbells'], false, 'Neutral grip curl. Hits brachialis and forearms.'),
('Skull Crusher', 'strength', ARRAY['triceps'], ARRAY['barbell', 'bench'], false, 'Lie on bench, lower bar to forehead, extend.'),
('Romanian Deadlift', 'compound', ARRAY['hamstrings', 'glutes', 'back'], ARRAY['barbell'], false, 'Stiff-leg hip hinge. Great for posterior chain.'),
('Front Squat', 'compound', ARRAY['quads', 'core', 'glutes'], ARRAY['barbell', 'squat_rack'], false, 'Bar in front rack position. More quad dominant.'),
('Lunges', 'compound', ARRAY['quads', 'glutes', 'hamstrings'], ARRAY['dumbbells'], false, 'Step forward, lower back knee, push back up.'),
('Bulgarian Split Squat', 'compound', ARRAY['quads', 'glutes'], ARRAY['dumbbells', 'bench'], false, 'Rear foot elevated lunge. Single leg focus.'),

-- Home exercises (sandbag, kettlebell, rower, bodyweight)
('Kettlebell Swing', 'compound', ARRAY['glutes', 'hamstrings', 'core', 'shoulders'], ARRAY['kettlebell'], false, 'Hip hinge power movement. Swing to shoulder height.'),
('Kettlebell Goblet Squat', 'compound', ARRAY['quads', 'glutes', 'core'], ARRAY['kettlebell'], false, 'Hold KB at chest, squat deep, stand up.'),
('Kettlebell Clean and Press', 'compound', ARRAY['full_body'], ARRAY['kettlebell'], false, 'Clean KB to rack, press overhead, reverse.'),
('Kettlebell Row', 'compound', ARRAY['back', 'biceps'], ARRAY['kettlebell'], false, 'Single arm row with kettlebell.'),
('Kettlebell Turkish Get-Up', 'compound', ARRAY['full_body', 'core', 'shoulders'], ARRAY['kettlebell'], false, 'Complex movement from floor to standing with KB overhead.'),
('Sandbag Clean', 'compound', ARRAY['full_body'], ARRAY['sandbag'], false, 'Explosive pull from floor to shoulders.'),
('Sandbag Squat', 'compound', ARRAY['quads', 'glutes', 'core'], ARRAY['sandbag'], false, 'Bear hug sandbag, squat deep.'),
('Sandbag Shoulder', 'compound', ARRAY['full_body', 'core'], ARRAY['sandbag'], false, 'Load sandbag to one shoulder, alternate.'),
('Sandbag Carry', 'compound', ARRAY['full_body', 'core', 'grip'], ARRAY['sandbag'], false, 'Carry sandbag for distance or time.'),
('Sandbag Deadlift', 'compound', ARRAY['back', 'hamstrings', 'glutes'], ARRAY['sandbag'], false, 'Deadlift movement with sandbag.'),
('Rowing Machine', 'cardio', ARRAY['full_body', 'back', 'legs'], ARRAY['rower'], false, 'Full body cardio. Drive with legs, pull with arms.'),

-- Bodyweight exercises (no equipment)
('Push-ups', 'compound', ARRAY['chest', 'triceps', 'shoulders', 'core'], ARRAY[]::TEXT[], false, 'Classic upper body push. Hands shoulder width, full range.'),
('Diamond Push-ups', 'compound', ARRAY['triceps', 'chest'], ARRAY[]::TEXT[], false, 'Hands together under chest. Tricep emphasis.'),
('Pike Push-ups', 'compound', ARRAY['shoulders', 'triceps'], ARRAY[]::TEXT[], false, 'Hips high, head toward floor. Shoulder press movement.'),
('Bodyweight Squats', 'compound', ARRAY['quads', 'glutes'], ARRAY[]::TEXT[], false, 'Air squat. Full depth, drive through heels.'),
('Jump Squats', 'compound', ARRAY['quads', 'glutes', 'calves'], ARRAY[]::TEXT[], false, 'Explosive squat with jump at top.'),
('Burpees', 'compound', ARRAY['full_body'], ARRAY[]::TEXT[], false, 'Squat thrust with push-up and jump.'),
('Mountain Climbers', 'cardio', ARRAY['core', 'shoulders', 'quads'], ARRAY[]::TEXT[], false, 'Plank position, drive knees to chest alternating.'),
('Plank', 'strength', ARRAY['core'], ARRAY[]::TEXT[], false, 'Hold straight body position on forearms or hands.'),
('Side Plank', 'strength', ARRAY['core', 'shoulders'], ARRAY[]::TEXT[], false, 'Lateral core stability. Stack feet or stagger.'),
('Glute Bridge', 'strength', ARRAY['glutes', 'hamstrings'], ARRAY[]::TEXT[], false, 'Lie on back, drive hips up, squeeze glutes.'),
('Superman', 'strength', ARRAY['back', 'glutes'], ARRAY[]::TEXT[], false, 'Lie face down, lift arms and legs simultaneously.'),
('Bicycle Crunches', 'strength', ARRAY['core'], ARRAY[]::TEXT[], false, 'Alternate elbow to opposite knee, rotating trunk.'),
('Leg Raises', 'strength', ARRAY['core'], ARRAY[]::TEXT[], false, 'Lie on back, raise straight legs, control down.'),
('Inverted Row', 'compound', ARRAY['back', 'biceps'], ARRAY['pull_up_bar'], false, 'Row body up to low bar. Bodyweight row variation.'),
('Box Jumps', 'compound', ARRAY['quads', 'glutes', 'calves'], ARRAY['box'], false, 'Jump onto box, stand fully, step down.')

ON CONFLICT (name) DO NOTHING;

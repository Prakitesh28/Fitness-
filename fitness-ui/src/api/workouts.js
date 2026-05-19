import client from './client';

export const getWorkouts = async (params = {}) => (await client.get('/workouts', { params })).data;
export const getWorkoutById = async (id) => (await client.get(`/workouts/${id}`)).data;
export const createWorkout = async (payload) => (await client.post('/workouts', payload)).data;
export const updateWorkout = async (id, payload) => (await client.patch(`/workouts/${id}`, payload)).data;
export const deleteWorkout = async (id) => (await client.delete(`/workouts/${id}`)).data;
export const addExerciseToWorkout = async (workoutId, payload) => (await client.post(`/workouts/${workoutId}/exercises`, payload)).data;
export const removeExerciseFromWorkout = async (workoutId, exerciseId) => (await client.delete(`/workouts/${workoutId}/exercises/${exerciseId}`)).data;
export const addSetToExercise = async (workoutId, exerciseId, payload) => (await client.post(`/workouts/${workoutId}/exercises/${exerciseId}/sets`, payload)).data;
export const getExercises = async (params = {}) => (await client.get('/exercises', { params })).data;

// Exercise API Service
import axios from './client';

const API_BASE_URL = '/api/exercises';

export const getExercises = async (params = {}) => {
  const response = await axios.get(API_BASE_URL, { params });
  return response.data;
};

export const getExercise = async (id) => {
  const response = await axios.get(`${API_BASE_URL}/${id}`);
  return response.data;
};

export const createExercise = async (exerciseData) => {
  const response = await axios.post(API_BASE_URL, exerciseData);
  return response.data;
};

export const updateExercise = async (id, exerciseData) => {
  const response = await axios.patch(`${API_BASE_URL}/${id}`, exerciseData);
  return response.data;
};

export const deleteExercise = async (id) => {
  await axios.delete(`${API_BASE_URL}/${id}`);
};
"use client"

import { useState, useEffect, useCallback } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"

export interface Plant {
  id: string
  name: string
  type: string
  age: number
  wateringFrequency: number
  lastWatered: string
  notes: string
  isActive: boolean
}

const STORAGE_KEY = "plantcare_plants"

let globalPlants: Plant[] = []
let listeners: Array<(plants: Plant[]) => void> = []

const notifyListeners = () => {
  listeners.forEach((listener) => listener(globalPlants))
}

export const usePlantStore = () => {
  const [plants, setPlants] = useState<Plant[]>(globalPlants)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Ajouter ce composant aux listeners
    listeners.push(setPlants)

    // Charger les données si pas encore fait
    if (globalPlants.length === 0) {
      loadPlants()
    } else {
      setIsLoading(false)
    }

    // Cleanup
    return () => {
      listeners = listeners.filter((listener) => listener !== setPlants)
    }
  }, [])

  const loadPlants = useCallback(async () => {
    try {
      setIsLoading(true)
      const stored = await AsyncStorage.getItem(STORAGE_KEY)
      if (stored) {
        globalPlants = JSON.parse(stored)
        notifyListeners()
      }
    } catch (error) {
      console.error("Erreur chargement plantes:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const savePlants = useCallback(async (newPlants: Plant[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newPlants))
      globalPlants = newPlants
      notifyListeners()
    } catch (error) {
      console.error("Erreur sauvegarde plantes:", error)
      throw error
    }
  }, [])

  const addPlant = useCallback(
    async (plant: Omit<Plant, "id">) => {
      const newPlant: Plant = {
        ...plant,
        id: Date.now().toString(),
        isActive: globalPlants.length === 0, // Première plante = active
      }
      await savePlants([...globalPlants, newPlant])
    },
    [savePlants],
  )

  const updatePlant = useCallback(
    async (id: string, updates: Partial<Plant>) => {
      const newPlants = globalPlants.map((plant) => (plant.id === id ? { ...plant, ...updates } : plant))
      await savePlants(newPlants)
    },
    [savePlants],
  )

  const deletePlant = useCallback(
    async (id: string) => {
      const plantToDelete = globalPlants.find((p) => p.id === id)
      const newPlants = globalPlants.filter((plant) => plant.id !== id)

      // Si on supprime la plante active, activer la première restante
      if (plantToDelete?.isActive && newPlants.length > 0) {
        newPlants[0].isActive = true
      }

      await savePlants(newPlants)
    },
    [savePlants],
  )

  const setActivePlant = useCallback(
    async (id: string) => {
      const newPlants = globalPlants.map((plant) => ({
        ...plant,
        isActive: plant.id === id,
      }))
      await savePlants(newPlants)
    },
    [savePlants],
  )

  const waterPlant = useCallback(
    async (id: string) => {
      await updatePlant(id, { lastWatered: new Date().toISOString() })
    },
    [updatePlant],
  )

  const getActivePlant = useCallback(() => {
    return globalPlants.find((plant) => plant.isActive) || null
  }, [])

  const refreshPlants = useCallback(() => {
    loadPlants()
  }, [loadPlants])

  return {
    plants,
    isLoading,
    addPlant,
    updatePlant,
    deletePlant,
    setActivePlant,
    waterPlant,
    getActivePlant,
    refreshPlants,
    loadPlants,
  }
}

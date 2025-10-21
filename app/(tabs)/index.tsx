"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, RefreshControl } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { initializeApp } from "firebase/app"
import { getDatabase, ref, onValue, off } from "firebase/database"
import { router } from "expo-router"
import { usePlantStore } from "../../hooks/usePlantStore"

const firebaseConfig = {
  apiKey: "AIzaSyBPkk9eEnCqd_tW-5Bi3rhMMNWTyL31JxQ",
  databaseURL: "https://smart-irrigation-e3172-default-rtdb.firebaseio.com",
  projectId: "smart-irrigation-e3172",
}

const app = initializeApp(firebaseConfig)
const database = getDatabase(app)

interface SensorData {
  temperature: number
  humidite_air: number
  humidite_sol: number
  besoin_eau: number
}

const PLANT_TYPES: { [key: string]: string } = {
  tomate: "Tomate",
  salade: "Salade",
  basilic: "Basilic",
  poivron: "Poivron",
  courgette: "Courgette",
  radis: "Radis",
  carotte: "Carotte",
  epinard: "Épinard",
  persil: "Persil",
  menthe: "Menthe",
  thym: "Thym",
}

export default function HomeScreen() {
  const { getActivePlant, waterPlant, refreshPlants } = usePlantStore()
  const [sensorData, setSensorData] = useState<SensorData>({
    temperature: 0,
    humidite_air: 0,
    humidite_sol: 0,
    besoin_eau: 0,
  })
  const [activePlant, setActivePlant] = useState(getActivePlant())
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(new Date())

  useEffect(() => {
    // Mettre à jour la plante active
    const updateActivePlant = () => {
      setActivePlant(getActivePlant())
    }

    updateActivePlant()

    // Écouter les changements Firebase
    const dataRef = ref(database, "/donnees")
    const unsubscribe = onValue(dataRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        setSensorData({
          temperature: data.temperature || 0,
          humidite_air: data.humidite_air || 0,
          humidite_sol: data.humidite_sol || 0,
          besoin_eau: data.besoin_eau || 0,
        })
        setLastUpdate(new Date())
      }
    })

    // Actualiser la plante active toutes les secondes
    const interval = setInterval(updateActivePlant, 1000)

    return () => {
      off(dataRef, "value", unsubscribe)
      clearInterval(interval)
    }
  }, [getActivePlant])

  const onRefresh = async () => {
    setIsRefreshing(true)
    try {
      await refreshPlants()
      setActivePlant(getActivePlant())
    } catch (error) {
      console.error("Erreur lors de l'actualisation:", error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleWaterPlant = async () => {
    if (!activePlant) return

    try {
      await waterPlant(activePlant.id)
      setActivePlant(getActivePlant()) // Actualiser l'affichage
      Alert.alert("Succès", `${activePlant.name} a été arrosée!`)
    } catch (error) {
      console.error("Erreur arrosage:", error)
      Alert.alert("Erreur", "Impossible d'enregistrer l'arrosage")
    }
  }

  const getDaysSinceWatered = (lastWatered: string) => {
    const lastWateredDate = new Date(lastWatered)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - lastWateredDate.getTime())
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getStatusColor = (value: number, type: "temp" | "humidity" | "water") => {
    switch (type) {
      case "temp":
        return value > 30 ? "#ff6b6b" : value < 15 ? "#4ecdc4" : "#4caf50"
      case "humidity":
        return value < 40 ? "#ff6b6b" : value > 80 ? "#ff9800" : "#4caf50"
      case "water":
        return value > 1.5 ? "#ff6b6b" : value > 0.5 ? "#ff9800" : "#4caf50"
      default:
        return "#4caf50"
    }
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>PlantCare IoT</Text>
          <Text style={styles.headerSubtitle}>
            {activePlant ? `Surveillance de ${activePlant.name}` : "Aucune plante sélectionnée"}
          </Text>
        </View>
        <Ionicons name="leaf" size={32} color="#fff" />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
      >
        {/* Active Plant Card */}
        {activePlant ? (
          <View style={styles.activePlantCard}>
            <View style={styles.activePlantHeader}>
              <View style={styles.activePlantInfo}>
                <Text style={styles.activePlantName}>{activePlant.name}</Text>
                <Text style={styles.activePlantType}>
                  {PLANT_TYPES[activePlant.type] || activePlant.type} • {activePlant.age} jours
                </Text>
                <Text style={styles.activePlantWatering}>
                  Arrosé il y a {getDaysSinceWatered(activePlant.lastWatered)} jour(s)
                </Text>
              </View>
              <TouchableOpacity style={styles.changePlantButton} onPress={() => router.push("/(tabs)/plants")}>
                <Text style={styles.changePlantText}>Changer</Text>
              </TouchableOpacity>
            </View>

            {activePlant.notes && <Text style={styles.activePlantNotes}>{activePlant.notes}</Text>}
          </View>
        ) : (
          <View style={styles.noPlantCard}>
            <Ionicons name="leaf-outline" size={48} color="#ccc" />
            <Text style={styles.noPlantTitle}>Aucune plante sélectionnée</Text>
            <Text style={styles.noPlantSubtitle}>Ajoutez une plante pour commencer le monitoring</Text>
            <TouchableOpacity style={styles.addPlantButton} onPress={() => router.push("/(tabs)/plants")}>
              <Text style={styles.addPlantButtonText}>Ajouter une plante</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Sensor Data Cards */}
        <View style={styles.sensorGrid}>
          <View style={[styles.sensorCard, { borderLeftColor: getStatusColor(sensorData.temperature, "temp") }]}>
            <View style={styles.sensorHeader}>
              <Ionicons name="thermometer" size={24} color={getStatusColor(sensorData.temperature, "temp")} />
              <Text style={styles.sensorTitle}>Température</Text>
            </View>
            <Text style={styles.sensorValue}>{sensorData.temperature}°C</Text>
            <Text style={styles.sensorStatus}>
              {sensorData.temperature > 30 ? "Trop chaud" : sensorData.temperature < 15 ? "Trop froid" : "Optimal"}
            </Text>
          </View>

          <View style={[styles.sensorCard, { borderLeftColor: getStatusColor(sensorData.humidite_air, "humidity") }]}>
            <View style={styles.sensorHeader}>
              <Ionicons name="cloud" size={24} color={getStatusColor(sensorData.humidite_air, "humidity")} />
              <Text style={styles.sensorTitle}>Humidité Air</Text>
            </View>
            <Text style={styles.sensorValue}>{sensorData.humidite_air}%</Text>
            <Text style={styles.sensorStatus}>
              {sensorData.humidite_air < 40 ? "Trop sec" : sensorData.humidite_air > 80 ? "Trop humide" : "Correct"}
            </Text>
          </View>

          <View style={[styles.sensorCard, { borderLeftColor: getStatusColor(sensorData.humidite_sol, "humidity") }]}>
            <View style={styles.sensorHeader}>
              <Ionicons name="water" size={24} color={getStatusColor(sensorData.humidite_sol, "humidity")} />
              <Text style={styles.sensorTitle}>Humidité Sol</Text>
            </View>
            <Text style={styles.sensorValue}>{sensorData.humidite_sol}%</Text>
            <Text style={styles.sensorStatus}>
              {sensorData.humidite_sol < 40 ? "Sol sec" : sensorData.humidite_sol > 80 ? "Sol saturé" : "Correct"}
            </Text>
          </View>

          <View style={[styles.sensorCard, { borderLeftColor: getStatusColor(sensorData.besoin_eau, "water") }]}>
            <View style={styles.sensorHeader}>
              <Ionicons name="droplet" size={24} color={getStatusColor(sensorData.besoin_eau, "water")} />
              <Text style={styles.sensorTitle}>Besoin en Eau</Text>
            </View>
            <Text style={styles.sensorValue}>{sensorData.besoin_eau}L</Text>
            <Text style={styles.sensorStatus}>
              {sensorData.besoin_eau > 1.5 ? "Urgent" : sensorData.besoin_eau > 0.5 ? "Bientôt" : "Pas nécessaire"}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.waterButton]}
            onPress={handleWaterPlant}
            disabled={!activePlant}
          >
            <Ionicons name="water" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>{activePlant ? `Arroser ${activePlant.name}` : "Arroser"}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.chatButton]}
            onPress={() => router.push("/(tabs)/chat")}
          >
            <Ionicons name="chatbubble-ellipses" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Assistant IA</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Stats */}
        <View style={styles.quickStats}>
          <Text style={styles.quickStatsTitle}>Résumé Rapide</Text>
          <View style={styles.statsList}>
            <View style={styles.statItem}>
              <Ionicons name="checkmark-circle" size={16} color="#4caf50" />
              <Text style={styles.statText}>
                Température: {sensorData.temperature > 30 || sensorData.temperature < 15 ? "À surveiller" : "Normale"}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons
                name={sensorData.humidite_sol < 40 ? "alert-circle" : "checkmark-circle"}
                size={16}
                color={sensorData.humidite_sol < 40 ? "#ff6b6b" : "#4caf50"}
              />
              <Text style={styles.statText}>
                Sol: {sensorData.humidite_sol < 40 ? "Arrosage nécessaire" : "Humidité correcte"}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons
                name={sensorData.besoin_eau > 1 ? "water" : "checkmark-circle"}
                size={16}
                color={sensorData.besoin_eau > 1 ? "#2196f3" : "#4caf50"}
              />
              <Text style={styles.statText}>
                Arrosage: {sensorData.besoin_eau > 1 ? `${sensorData.besoin_eau}L recommandés` : "Pas nécessaire"}
              </Text>
            </View>
          </View>
        </View>

        {/* Last Update */}
        <Text style={styles.lastUpdate}>Dernière mise à jour: {lastUpdate.toLocaleTimeString()}</Text>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    backgroundColor: "#4caf50",
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
  headerSubtitle: {
    color: "#e8f5e8",
    fontSize: 14,
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  activePlantCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: "#4caf50",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activePlantHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  activePlantInfo: {
    flex: 1,
  },
  activePlantName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  activePlantType: {
    fontSize: 14,
    color: "#4caf50",
    fontWeight: "600",
    marginBottom: 2,
  },
  activePlantWatering: {
    fontSize: 12,
    color: "#666",
  },
  changePlantButton: {
    backgroundColor: "#4caf50",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  changePlantText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  activePlantNotes: {
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
    paddingLeft: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#e0e0e0",
  },
  noPlantCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 32,
    marginBottom: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  noPlantTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#666",
    marginTop: 16,
    marginBottom: 8,
  },
  noPlantSubtitle: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    marginBottom: 20,
  },
  addPlantButton: {
    backgroundColor: "#4caf50",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addPlantButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  sensorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  sensorCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    width: "48%",
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sensorHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  sensorTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginLeft: 8,
  },
  sensorValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  sensorStatus: {
    fontSize: 12,
    color: "#666",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  waterButton: {
    backgroundColor: "#2196f3",
  },
  chatButton: {
    backgroundColor: "#4caf50",
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  quickStats: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickStatsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  statsList: {
    gap: 8,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  statText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 8,
    flex: 1,
  },
  lastUpdate: {
    textAlign: "center",
    color: "#999",
    fontSize: 12,
    marginBottom: 20,
  },
})

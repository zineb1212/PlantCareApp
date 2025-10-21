"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl, Platform } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { initializeApp } from "firebase/app"
import { getDatabase, ref, onValue, off } from "firebase/database"
import { router } from "expo-router"

// Configuration Firebase (remplacez par vos propres identifiants)
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
  luminosite?: number
}

export default function HomeScreen() {
  const [sensorData, setSensorData] = useState<SensorData>({
    temperature: 0,
    humidite_air: 0,
    humidite_sol: 0,
    besoin_eau: 0,
    luminosite: 91,
  })
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  useEffect(() => {
    const dataRef = ref(database, "/donnees")

    const unsubscribe = onValue(dataRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        setSensorData({
          temperature: data.temperature || 0,
          humidite_air: data.humidite_air || 0,
          humidite_sol: data.humidite_sol || 0,
          besoin_eau: data.besoin_eau || 0,
          luminosite: data.luminosite || 91,
        })
        setLastUpdate(new Date())
      }
    })

    return () => off(dataRef, "value", unsubscribe)
  }, [])

  const onRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => {
      setIsRefreshing(false)
    }, 1000)
  }

  const handleIrrigation = () => {
    Alert.alert(
      "Contrôle Arrosage",
      `Besoin en eau détecté: ${sensorData.besoin_eau.toFixed(1)}L\nVoulez-vous démarrer l'arrosage?`,
      [
        { text: "Annuler", style: "cancel" },
        { text: "Arroser", onPress: () => Alert.alert("Arrosage démarré!") },
      ],
    )
  }

  const getStatusColor = (type: string, value: number) => {
    switch (type) {
      case "temperature":
        return value > 30 ? "#ff6b6b" : value > 20 ? "#4ecdc4" : "#45b7d1"
      case "humidite_air":
        return value < 40 ? "#ff6b6b" : value < 70 ? "#4ecdc4" : "#45b7d1"
      case "humidite_sol":
        return value < 40 ? "#ff6b6b" : value < 60 ? "#ffa726" : "#4caf50"
      case "luminosite":
        return value > 80 ? "#ffa726" : "#4ecdc4"
      default:
        return "#4ecdc4"
    }
  }

  const SensorCard = ({
    title,
    value,
    unit,
    icon,
    type,
  }: {
    title: string
    value: number
    unit: string
    icon: string
    type: string
  }) => (
    <View style={[styles.card, { borderLeftColor: getStatusColor(type, value) }]}>
      <View style={styles.cardHeader}>
        <Ionicons name={icon as any} size={20} color={getStatusColor(type, value)} />
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      <Text style={[styles.cardValue, { color: getStatusColor(type, value) }]}>
        {value.toFixed(type === "temperature" ? 1 : 0)}
        {unit}
      </Text>
    </View>
  )

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="leaf" size={24} color="#fff" />
          <Text style={styles.headerTitle}>PlantCare</Text>
        </View>
        <View style={styles.headerRight}>
          <Ionicons name="wifi" size={20} color="#fff" />
          <Text style={styles.headerStatus}>100%</Text>
        </View>
      </View>

      <View style={styles.content}>
        {/* Subtitle */}
        <Text style={styles.subtitle}>Surveillance IoT</Text>

        {/* Notifications */}
        <TouchableOpacity style={styles.notificationCard}>
          <View style={styles.notificationHeader}>
            <Ionicons name="notifications-outline" size={20} color="#4285f4" />
            <Text style={styles.notificationTitle}>Notifications</Text>
            <TouchableOpacity style={styles.activateButton}>
              <Text style={styles.activateButtonText}>Activer</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.notificationSubtitle}>Recevez des alertes pour vos plantes</Text>
        </TouchableOpacity>

        {/* Sensor Cards Grid */}
        <View style={styles.sensorsGrid}>
          <SensorCard
            title="TEMPÉRATURE"
            value={sensorData.temperature}
            unit="°C"
            icon="thermometer-outline"
            type="temperature"
          />
          <SensorCard
            title="HUMIDITÉ AIR"
            value={sensorData.humidite_air}
            unit="%"
            icon="water-outline"
            type="humidite_air"
          />
          <SensorCard
            title="HUMIDITÉ SOL"
            value={sensorData.humidite_sol}
            unit="%"
            icon="flower-outline"
            type="humidite_sol"
          />
          <SensorCard
            title="LUMINOSITÉ"
            value={sensorData.luminosite || 91}
            unit="%"
            icon="sunny-outline"
            type="luminosite"
          />
        </View>

        {/* Irrigation Control */}
        <View style={styles.irrigationSection}>
          <View style={styles.irrigationHeader}>
            <Ionicons name="water" size={20} color="#4285f4" />
            <Text style={styles.irrigationTitle}>Contrôle Arrosage</Text>
          </View>

          <TouchableOpacity style={styles.irrigationButton} onPress={handleIrrigation}>
            <Ionicons name="water" size={24} color="#fff" />
            <Text style={styles.irrigationButtonText}>Arroser Maintenant ({sensorData.besoin_eau.toFixed(1)}L)</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Actions */}
        <View style={styles.bottomActions}>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push("/(tabs)/chat")}>
            <Ionicons name="chatbubble-ellipses-outline" size={32} color="#4caf50" />
            <Text style={styles.actionTitle}>Assistant IA</Text>
            <Text style={styles.actionSubtitle}>Conseils personnalisés</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={() => router.push("/(tabs)/settings")}>
            <Ionicons name="settings-outline" size={32} color="#666" />
            <Text style={styles.actionTitle}>Paramètres</Text>
            <Text style={styles.actionSubtitle}>Configuration</Text>
          </TouchableOpacity>
        </View>

        {/* Last Update */}
        <Text style={styles.lastUpdate}>Dernière mise à jour: {lastUpdate.toLocaleTimeString()}</Text>
      </View>
    </ScrollView>
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
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 8,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerStatus: {
    color: "#fff",
    marginLeft: 5,
    fontSize: 14,
  },
  content: {
    padding: 20,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
  },
  notificationCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
      },
    }),
  },
  notificationHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
    flex: 1,
  },
  activateButton: {
    backgroundColor: "#4285f4",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  activateButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  notificationSubtitle: {
    color: "#666",
    fontSize: 14,
  },
  sensorsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    width: "48%",
    marginBottom: 12,
    borderLeftWidth: 4,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
      },
    }),
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 12,
    color: "#666",
    fontWeight: "600",
    marginLeft: 6,
  },
  cardValue: {
    fontSize: 24,
    fontWeight: "bold",
  },
  irrigationSection: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
      },
    }),
  },
  irrigationHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  irrigationTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  irrigationButton: {
    backgroundColor: "#4285f4",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 8,
  },
  irrigationButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  bottomActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  actionCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    width: "48%",
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
      },
    }),
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 8,
    textAlign: "center",
  },
  actionSubtitle: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
    textAlign: "center",
  },
  lastUpdate: {
    textAlign: "center",
    color: "#999",
    fontSize: 12,
    marginTop: 10,
  },
})

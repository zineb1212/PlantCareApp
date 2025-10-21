"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { initializeApp } from "firebase/app"
import { getDatabase, ref, onValue, off } from "firebase/database"
import { usePlantStore } from "../../hooks/usePlantStore"

const firebaseConfig = {
  apiKey: "AIzaSyBPkk9eEnCqd_tW-5Bi3rhMMNWTyL31JxQ",
  databaseURL: "https://smart-irrigation-e3172-default-rtdb.firebaseio.com",
  projectId: "smart-irrigation-e3172",
}

const app = initializeApp(firebaseConfig)
const database = getDatabase(app)

interface Message {
  id: string
  text: string
  isUser: boolean
  timestamp: Date
}

interface SensorData {
  temperature: number
  humidite_air: number
  humidite_sol: number
  besoin_eau: number
}

const PLANT_PROFILES: { [key: string]: any } = {
  tomate: {
    type: "tomate",
    name: "Tomate",
    waterNeeds: "2-3L par semaine",
    tempRange: "18-25°C",
    humidityRange: "60-80%",
  },
  salade: {
    type: "salade",
    name: "Salade",
    waterNeeds: "1-1.5L par semaine",
    tempRange: "15-20°C",
    humidityRange: "70-85%",
  },
  basilic: {
    type: "basilic",
    name: "Basilic",
    waterNeeds: "1.5-2L par semaine",
    tempRange: "20-25°C",
    humidityRange: "65-75%",
  },
  poivron: {
    type: "poivron",
    name: "Poivron",
    waterNeeds: "2-2.5L par semaine",
    tempRange: "20-28°C",
    humidityRange: "60-70%",
  },
  courgette: {
    type: "courgette",
    name: "Courgette",
    waterNeeds: "2.5-3L par semaine",
    tempRange: "18-24°C",
    humidityRange: "65-75%",
  },
  radis: {
    type: "radis",
    name: "Radis",
    waterNeeds: "1L par semaine",
    tempRange: "10-18°C",
    humidityRange: "70-80%",
  },
  carotte: {
    type: "carotte",
    name: "Carotte",
    waterNeeds: "1.5L par semaine",
    tempRange: "15-21°C",
    humidityRange: "65-75%",
  },
  epinard: {
    type: "epinard",
    name: "Épinard",
    waterNeeds: "1.5-2L par semaine",
    tempRange: "12-18°C",
    humidityRange: "70-85%",
  },
  persil: {
    type: "persil",
    name: "Persil",
    waterNeeds: "1L par semaine",
    tempRange: "15-22°C",
    humidityRange: "65-75%",
  },
  menthe: {
    type: "menthe",
    name: "Menthe",
    waterNeeds: "2L par semaine",
    tempRange: "18-24°C",
    humidityRange: "70-80%",
  },
  thym: {
    type: "thym",
    name: "Thym",
    waterNeeds: "0.5L par semaine",
    tempRange: "20-30°C",
    humidityRange: "40-60%",
  },
}

export default function ChatScreen() {
  const { plants, getActivePlant, setActivePlant } = usePlantStore()
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState("")
  const [sensorData, setSensorData] = useState<SensorData>({
    temperature: 0,
    humidite_air: 0,
    humidite_sol: 0,
    besoin_eau: 0,
  })
  const [activePlant, setActiveP] = useState(getActivePlant())
  const [showPlantSelector, setShowPlantSelector] = useState(false)

  useEffect(() => {
    // Mettre à jour la plante active
    const updateActivePlant = () => {
      setActiveP(getActivePlant())
    }

    updateActivePlant()

    // Récupérer les données des capteurs
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
      }
    })

    // Actualiser la plante active toutes les secondes
    const interval = setInterval(updateActivePlant, 1000)

    return () => {
      off(dataRef, "value", unsubscribe)
      clearInterval(interval)
    }
  }, [getActivePlant])

  useEffect(() => {
    // Message d'accueil personnalisé
    const plantName = activePlant ? activePlant.name : "vos plantes"
    const plantType = activePlant ? activePlant.type : "tomate"
    const welcomeMessage: Message = {
      id: "welcome",
      text: `Bonjour! Je suis votre assistant IA spécialisé dans les plantes. ${
        activePlant
          ? `Je vois que vous vous occupez de "${activePlant.name}" (${PLANT_PROFILES[plantType]?.name || plantType}).`
          : 'Ajoutez une plante dans l\'onglet "Mes Plantes" pour des conseils personnalisés!'
      } Je peux analyser vos données de capteurs en temps réel et vous donner des conseils personnalisés!`,
      isUser: false,
      timestamp: new Date(),
    }
    setMessages([welcomeMessage])
  }, [activePlant])

  const generateAIResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase()
    const plantName = activePlant ? activePlant.name : "vos plantes"
    const plantType = activePlant ? activePlant.type : "tomate"
    const plant = PLANT_PROFILES[plantType] || PLANT_PROFILES.tomate
    const currentTemp = sensorData.temperature
    const currentHumidityAir = sensorData.humidite_air
    const currentHumiditySol = sensorData.humidite_sol
    const currentWaterNeed = sensorData.besoin_eau

    // Analyse des conditions actuelles
    const tempStatus = currentTemp > 30 ? "élevée" : currentTemp < 15 ? "basse" : "normale"
    const soilStatus = currentHumiditySol < 40 ? "sèche" : currentHumiditySol > 80 ? "très humide" : "correcte"

    if (message.includes("état") || message.includes("condition") || message.includes("comment")) {
      return `📊 **État actuel de "${plantName}":**
      
🌡️ Température: ${currentTemp}°C (${tempStatus})
💧 Humidité sol: ${currentHumiditySol}% (${soilStatus})
🌬️ Humidité air: ${currentHumidityAir}%
💦 Besoin en eau: ${currentWaterNeed}L

${currentTemp > 25 ? "⚠️ Il fait chaud, surveillez l'arrosage!" : ""}
${currentHumiditySol < 40 ? "🚨 Le sol est sec, arrosage recommandé!" : ""}
${currentHumiditySol > 80 ? "⚠️ Attention au sur-arrosage!" : ""}`
    }

    if (message.includes("arrosage") || message.includes("eau")) {
      return `💧 **Conseils d'arrosage pour "${plantName}":**

Besoins normaux: ${plant.waterNeeds}
Actuellement: ${currentWaterNeed}L recommandés

Avec une humidité du sol à ${currentHumiditySol}%:
${
  currentHumiditySol < 40
    ? "🔴 Arrosage urgent nécessaire!"
    : currentHumiditySol < 60
      ? "🟡 Arrosage bientôt nécessaire"
      : "🟢 Niveau d'humidité correct"
}

💡 Conseil: ${currentTemp > 25 ? "Par cette chaleur, arrosez tôt le matin ou en soirée." : "Arrosez de préférence le matin."}`
    }

    if (message.includes("température") || message.includes("chaleur") || message.includes("froid")) {
      return `🌡️ **Analyse de température pour "${plantName}":**

Température actuelle: ${currentTemp}°C
Plage optimale: ${plant.tempRange}

${
  currentTemp > 30
    ? "🔥 Il fait trop chaud! Augmentez l'arrosage et créez de l'ombre si possible."
    : currentTemp < 15
      ? "🥶 Il fait trop froid! Protégez vos plantes et réduisez l'arrosage."
      : "✅ Température dans la plage optimale!"
}

${currentTemp > 25 ? "💡 Conseil: Arrosez plus fréquemment et vérifiez l'humidité du sol." : ""}`
    }

    if (message.includes("humidité")) {
      return `💨 **Analyse d'humidité pour "${plantName}":**

Humidité du sol: ${currentHumiditySol}% (idéal: ${plant.humidityRange})
Humidité de l'air: ${currentHumidityAir}%

${
  currentHumiditySol < 40
    ? "🚨 Sol trop sec - Arrosage nécessaire!"
    : currentHumiditySol > 80
      ? "⚠️ Sol trop humide - Risque de pourriture!"
      : "✅ Humidité du sol correcte"
}

💡 ${plant.name}s préfèrent une humidité du sol entre 60-80%.`
    }

    if (message.includes("problème") || message.includes("aide") || message.includes("conseil")) {
      return `🌱 **Diagnostic complet pour "${plantName}":**

📊 Conditions actuelles:
- Température: ${currentTemp}°C ${currentTemp > 30 ? "(trop chaud)" : currentTemp < 15 ? "(trop froid)" : "(OK)"}
- Humidité sol: ${currentHumiditySol}% ${currentHumiditySol < 40 ? "(trop sec)" : currentHumiditySol > 80 ? "(trop humide)" : "(OK)"}
- Besoin eau: ${currentWaterNeed}L

🎯 Actions recommandées:
${currentWaterNeed > 1 ? "• Arroser maintenant (" + currentWaterNeed + "L)" : "• Pas d'arrosage nécessaire"}
${currentTemp > 25 ? "• Créer de l'ombre pendant les heures chaudes" : ""}
${currentHumiditySol < 40 ? "• Surveiller l'humidité du sol de près" : ""}

❓ Posez-moi des questions spécifiques sur l'arrosage, la température, ou les soins!`
    }

    return `🤖 Je peux vous aider avec "${plantName}"! 

Tapez:
- "état" pour voir les conditions actuelles
- "arrosage" pour les conseils d'irrigation  
- "température" pour l'analyse thermique
- "problème" pour un diagnostic complet

Vos capteurs montrent: ${currentTemp}°C, ${currentHumiditySol}% humidité sol, ${currentWaterNeed}L d'eau recommandés.`
  }

  const sendMessage = () => {
    if (inputText.trim() === "") return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      isUser: true,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: generateAIResponse(inputText),
        isUser: false,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, aiResponse])
    }, 1000)

    setInputText("")
  }

  const selectPlant = async (plant: any) => {
    try {
      await setActivePlant(plant.id)
      setActiveP(plant)
      setShowPlantSelector(false)

      const changeMessage: Message = {
        id: Date.now().toString(),
        text: `✅ Parfait! Je vais maintenant vous donner des conseils spécifiques pour "${plant.name}" en analysant vos données de capteurs en temps réel.`,
        isUser: false,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, changeMessage])
    } catch (error) {
      console.error("Erreur lors de la sélection de la plante:", error)
    }
  }

  const plantDisplayName = activePlant ? activePlant.name : "vos plantes"

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="chatbubble-ellipses" size={24} color="#fff" />
        <Text style={styles.headerTitle}>Assistant IA - {activePlant ? activePlant.name : "Mes Plantes"}</Text>
        <TouchableOpacity onPress={() => setShowPlantSelector(true)}>
          <Ionicons name="settings-outline" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Plant Selector Modal */}
      {showPlantSelector && (
        <View style={styles.plantSelector}>
          <Text style={styles.plantSelectorTitle}>Choisissez votre plante:</Text>
          {plants.length > 0 ? (
            plants.map((plant) => (
              <TouchableOpacity
                key={plant.id}
                style={[styles.plantOption, plant.isActive && styles.selectedPlant]}
                onPress={() => selectPlant(plant)}
              >
                <Text style={styles.plantOptionText}>{plant.name}</Text>
                <Text style={styles.plantOptionDetails}>
                  {PLANT_PROFILES[plant.type]?.name || plant.type} • {plant.age} jours
                </Text>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.noPlants}>
              Aucune plante ajoutée. Allez dans l'onglet "Mes Plantes" pour en ajouter.
            </Text>
          )}
          <TouchableOpacity style={styles.closeButton} onPress={() => setShowPlantSelector(false)}>
            <Text style={styles.closeButtonText}>Fermer</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Sensor Status Bar */}
      <View style={styles.sensorBar}>
        <View style={styles.sensorItem}>
          <Ionicons name="thermometer" size={16} color="#ff6b6b" />
          <Text style={styles.sensorText}>{sensorData.temperature}°C</Text>
        </View>
        <View style={styles.sensorItem}>
          <Ionicons name="water" size={16} color="#4ecdc4" />
          <Text style={styles.sensorText}>{sensorData.humidite_sol}%</Text>
        </View>
        <View style={styles.sensorItem}>
          <Ionicons name="droplet" size={16} color="#45b7d1" />
          <Text style={styles.sensorText}>{sensorData.besoin_eau}L</Text>
        </View>
      </View>

      {/* Messages */}
      <ScrollView style={styles.messagesContainer} showsVerticalScrollIndicator={false}>
        {messages.map((message) => (
          <View key={message.id} style={[styles.messageBubble, message.isUser ? styles.userMessage : styles.aiMessage]}>
            <Text style={[styles.messageText, message.isUser ? styles.userMessageText : styles.aiMessageText]}>
              {message.text}
            </Text>
            <Text style={styles.timestamp}>
              {message.timestamp.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </View>
        ))}
      </ScrollView>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.quickButton} onPress={() => setInputText("état")}>
          <Text style={styles.quickButtonText}>État</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickButton} onPress={() => setInputText("arrosage")}>
          <Text style={styles.quickButtonText}>Arrosage</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickButton} onPress={() => setInputText("problème")}>
          <Text style={styles.quickButtonText}>Diagnostic</Text>
        </TouchableOpacity>
      </View>

      {/* Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder={`Posez votre question sur ${plantDisplayName}...`}
          multiline
          maxLength={500}
        />
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage} disabled={inputText.trim() === ""}>
          <Ionicons name="send" size={20} color={inputText.trim() === "" ? "#ccc" : "#4caf50"} />
        </TouchableOpacity>
      </View>
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
    alignItems: "center",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 12,
    flex: 1,
  },
  sensorBar: {
    backgroundColor: "#fff",
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  sensorItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  sensorText: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: "600",
  },
  plantSelector: {
    position: "absolute",
    top: 100,
    left: 20,
    right: 20,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    zIndex: 1000,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  plantSelectorTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  plantOption: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  selectedPlant: {
    backgroundColor: "#e8f5e8",
    borderColor: "#4caf50",
  },
  plantOptionText: {
    fontSize: 16,
    fontWeight: "600",
  },
  plantOptionDetails: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  noPlants: {
    textAlign: "center",
    color: "#666",
    fontStyle: "italic",
    padding: 20,
  },
  closeButton: {
    backgroundColor: "#4caf50",
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  closeButtonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "600",
  },
  messagesContainer: {
    flex: 1,
    padding: 16,
  },
  messageBubble: {
    maxWidth: "85%",
    marginVertical: 4,
    padding: 12,
    borderRadius: 16,
  },
  userMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#4caf50",
  },
  aiMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  messageText: {
    fontSize: 14,
    lineHeight: 18,
  },
  userMessageText: {
    color: "#fff",
  },
  aiMessageText: {
    color: "#333",
  },
  timestamp: {
    fontSize: 10,
    color: "#999",
    marginTop: 4,
    alignSelf: "flex-end",
  },
  quickActions: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  quickButton: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  quickButtonText: {
    fontSize: 12,
    color: "#666",
  },
  inputContainer: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "#fff",
    alignItems: "flex-end",
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    marginLeft: 12,
    padding: 12,
  },
})

"use client"

import { useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Alert,
  RefreshControl,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { usePlantStore } from "../../hooks/usePlantStore"

const PLANT_TYPES = [
  { value: "tomate", label: "Tomate" },
  { value: "romarin ", label: "romarin " },
  { value: "salade", label: "Salade" },
  { value: "basilic", label: "Basilic" },
  { value: "poivron", label: "Poivron" },
  { value: "courgette", label: "Courgette" },
  { value: "radis", label: "Radis" },
  { value: "carotte", label: "Carotte" },
  { value: "epinard", label: "Épinard" },
  { value: "persil", label: "Persil" },
  { value: "menthe", label: "Menthe" },
  { value: "thym", label: "Thym" },
]

export default function PlantsScreen() {
  const { plants, isLoading, addPlant, updatePlant, deletePlant, setActivePlant, waterPlant, refreshPlants } =
    usePlantStore()

  const [showModal, setShowModal] = useState(false)
  const [editingPlant, setEditingPlant] = useState<any>(null)
  const [showTypeSelector, setShowTypeSelector] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Form states
  const [formName, setFormName] = useState("")
  const [formType, setFormType] = useState("tomate")
  const [formAge, setFormAge] = useState("")
  const [formFrequency, setFormFrequency] = useState("3")
  const [formNotes, setFormNotes] = useState("")

  const onRefresh = async () => {
    setIsRefreshing(true)
    try {
      await refreshPlants()
    } catch (error) {
      console.error("Erreur actualisation:", error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const openAddModal = () => {
    setEditingPlant(null)
    setFormName("")
    setFormType("tomate")
    setFormAge("")
    setFormFrequency("3")
    setFormNotes("")
    setShowModal(true)
  }

  const openEditModal = (plant: any) => {
    setEditingPlant(plant)
    setFormName(plant.name)
    setFormType(plant.type)
    setFormAge(plant.age.toString())
    setFormFrequency(plant.wateringFrequency.toString())
    setFormNotes(plant.notes || "")
    setShowModal(true)
  }

  const savePlant = async () => {
    if (!formName.trim()) {
      Alert.alert("Erreur", "Le nom de la plante est requis")
      return
    }

    const age = Number.parseInt(formAge)
    const frequency = Number.parseInt(formFrequency)

    if (isNaN(age) || age < 0) {
      Alert.alert("Erreur", "L'âge doit être un nombre positif")
      return
    }

    if (isNaN(frequency) || frequency < 1) {
      Alert.alert("Erreur", "La fréquence doit être d'au moins 1 jour")
      return
    }

    try {
      if (editingPlant) {
        await updatePlant(editingPlant.id, {
          name: formName.trim(),
          type: formType,
          age: age,
          wateringFrequency: frequency,
          notes: formNotes.trim(),
        })
        Alert.alert("Succès", "Plante modifiée avec succès!")
      } else {
        await addPlant({
          name: formName.trim(),
          type: formType,
          age: age,
          wateringFrequency: frequency,
          notes: formNotes.trim(),
          lastWatered: new Date().toISOString(),
          isActive: false,
        })
        Alert.alert("Succès", "Plante ajoutée avec succès!")
      }
      setShowModal(false)
    } catch (error) {
      console.error("Erreur sauvegarde:", error)
      Alert.alert("Erreur", "Impossible de sauvegarder la plante")
    }
  }

  const handleDeletePlant = (plant: any) => {
    Alert.alert(
      "Supprimer la plante",
      `Êtes-vous sûr de vouloir supprimer "${plant.name}" ? Cette action est irréversible.`,
      [
        {
          text: "Annuler",
          style: "cancel",
        },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              await deletePlant(plant.id)
              Alert.alert("Succès", "Plante supprimée avec succès!")
            } catch (error) {
              console.error("Erreur suppression:", error)
              Alert.alert("Erreur", "Impossible de supprimer la plante")
            }
          },
        },
      ],
    )
  }

  const handleSetActivePlant = async (plantId: string) => {
    try {
      await setActivePlant(plantId)
      Alert.alert("Succès", "Plante active changée!")
    } catch (error) {
      console.error("Erreur changement plante active:", error)
      Alert.alert("Erreur", "Impossible de changer la plante active")
    }
  }

  const handleWaterPlant = async (plant: any) => {
    try {
      await waterPlant(plant.id)
      Alert.alert("Succès", `${plant.name} a été arrosée!`)
    } catch (error) {
      console.error("Erreur arrosage:", error)
      Alert.alert("Erreur", "Impossible d'enregistrer l'arrosage")
    }
  }

  const getPlantTypeLabel = (type: string) => {
    const plantType = PLANT_TYPES.find((pt) => pt.value === type)
    return plantType ? plantType.label : type
  }

  const getDaysSinceWatered = (lastWatered: string) => {
    const lastWateredDate = new Date(lastWatered)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - lastWateredDate.getTime())
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Ionicons name="leaf" size={48} color="#4caf50" />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="leaf" size={24} color="#fff" />
        <Text style={styles.headerTitle}>Mes Plantes ({plants.length})</Text>
        <TouchableOpacity onPress={openAddModal}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Plants List */}
      <ScrollView
        style={styles.plantsContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
      >
        {plants.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="leaf-outline" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>Aucune plante ajoutée</Text>
            <Text style={styles.emptySubtitle}>Appuyez sur le bouton + pour ajouter votre première plante</Text>
          </View>
        ) : (
          plants.map((plant) => {
            const daysSinceWatered = getDaysSinceWatered(plant.lastWatered)
            const needsWater = daysSinceWatered >= plant.wateringFrequency

            return (
              <View key={plant.id} style={[styles.plantCard, plant.isActive && styles.activePlantCard]}>
                {plant.isActive && (
                  <View style={styles.activeBadge}>
                    <Text style={styles.activeBadgeText}>ACTIVE</Text>
                  </View>
                )}

                <View style={styles.plantHeader}>
                  <View style={styles.plantInfo}>
                    <Text style={styles.plantName}>{plant.name}</Text>
                    <Text style={styles.plantType}>{getPlantTypeLabel(plant.type)}</Text>
                    <Text style={styles.plantAge}>{plant.age} jours</Text>
                  </View>

                  <TouchableOpacity
                    style={[styles.activeButton, plant.isActive && styles.activeButtonSelected]}
                    onPress={() => handleSetActivePlant(plant.id)}
                  >
                    <Ionicons
                      name={plant.isActive ? "checkmark-circle" : "checkmark-circle-outline"}
                      size={24}
                      color={plant.isActive ? "#4caf50" : "#ccc"}
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.wateringInfo}>
                  <View style={styles.wateringStatus}>
                    <Ionicons name="water" size={16} color={needsWater ? "#ff6b6b" : "#4caf50"} />
                    <Text style={[styles.wateringText, needsWater && styles.needsWaterText]}>
                      {needsWater ? `Arrosage nécessaire (${daysSinceWatered}j)` : `Arrosé il y a ${daysSinceWatered}j`}
                    </Text>
                  </View>
                  <Text style={styles.frequencyText}>Fréquence: tous les {plant.wateringFrequency} jours</Text>
                </View>

                {plant.notes && <Text style={styles.plantNotes}>{plant.notes}</Text>}

                <View style={styles.plantActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.waterButton]}
                    onPress={() => handleWaterPlant(plant)}
                  >
                    <Ionicons name="water" size={16} color="#fff" />
                    <Text style={styles.actionButtonText}>Arroser</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, styles.editButton]}
                    onPress={() => openEditModal(plant)}
                  >
                    <Ionicons name="create" size={16} color="#fff" />
                    <Text style={styles.actionButtonText}>Modifier</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleDeletePlant(plant)}
                  >
                    <Ionicons name="trash" size={16} color="#fff" />
                    <Text style={styles.actionButtonText}>Supprimer</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )
          })
        )}
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{editingPlant ? "Modifier la plante" : "Ajouter une plante"}</Text>
            <TouchableOpacity onPress={savePlant}>
              <Text style={styles.saveButton}>Sauvegarder</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Nom de la plante *</Text>
              <TextInput
                style={styles.input}
                value={formName}
                onChangeText={setFormName}
                placeholder="Ex: Ma tomate du jardin"
                maxLength={50}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Type de plante *</Text>
              <TouchableOpacity style={styles.typeSelector} onPress={() => setShowTypeSelector(true)}>
                <Text style={styles.typeSelectorText}>{getPlantTypeLabel(formType)}</Text>
                <Ionicons name="chevron-down" size={20} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Âge (en jours) *</Text>
              <TextInput
                style={styles.input}
                value={formAge}
                onChangeText={setFormAge}
                placeholder="Ex: 30"
                keyboardType="numeric"
                maxLength={4}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Fréquence d'arrosage (jours) *</Text>
              <TextInput
                style={styles.input}
                value={formFrequency}
                onChangeText={setFormFrequency}
                placeholder="Ex: 3"
                keyboardType="numeric"
                maxLength={2}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Notes (optionnel)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formNotes}
                onChangeText={setFormNotes}
                placeholder="Ajoutez des notes sur votre plante..."
                multiline
                numberOfLines={3}
                maxLength={200}
              />
            </View>
          </ScrollView>
        </View>

        {/* Type Selector Modal */}
        <Modal visible={showTypeSelector} animationType="fade" transparent>
          <View style={styles.typeModalOverlay}>
            <View style={styles.typeModalContent}>
              <Text style={styles.typeModalTitle}>Choisir le type de plante</Text>
              <ScrollView>
                {PLANT_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={[styles.typeOption, formType === type.value && styles.selectedTypeOption]}
                    onPress={() => {
                      setFormType(type.value)
                      setShowTypeSelector(false)
                    }}
                  >
                    <Text style={[styles.typeOptionText, formType === type.value && styles.selectedTypeOptionText]}>
                      {type.label}
                    </Text>
                    {formType === type.value && <Ionicons name="checkmark" size={20} color="#4caf50" />}
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity style={styles.typeModalCloseButton} onPress={() => setShowTypeSelector(false)}>
                <Text style={styles.typeModalCloseText}>Fermer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
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
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 12,
    flex: 1,
  },
  plantsContainer: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#666",
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    marginTop: 8,
    paddingHorizontal: 40,
  },
  plantCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activePlantCard: {
    borderWidth: 2,
    borderColor: "#4caf50",
  },
  activeBadge: {
    position: "absolute",
    top: -8,
    right: 16,
    backgroundColor: "#4caf50",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
  plantHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  plantInfo: {
    flex: 1,
  },
  plantName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  plantType: {
    fontSize: 14,
    color: "#4caf50",
    fontWeight: "600",
    marginBottom: 2,
  },
  plantAge: {
    fontSize: 12,
    color: "#666",
  },
  activeButton: {
    padding: 8,
  },
  activeButtonSelected: {
    backgroundColor: "#e8f5e8",
    borderRadius: 20,
  },
  wateringInfo: {
    marginBottom: 12,
  },
  wateringStatus: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  wateringText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#666",
  },
  needsWaterText: {
    color: "#ff6b6b",
    fontWeight: "600",
  },
  frequencyText: {
    fontSize: 12,
    color: "#999",
  },
  plantNotes: {
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
    marginBottom: 12,
    paddingLeft: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#e0e0e0",
  },
  plantActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginHorizontal: 2,
  },
  waterButton: {
    backgroundColor: "#2196f3",
  },
  editButton: {
    backgroundColor: "#ff9800",
  },
  deleteButton: {
    backgroundColor: "#f44336",
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  saveButton: {
    color: "#4caf50",
    fontSize: 16,
    fontWeight: "600",
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  typeSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
  },
  typeSelectorText: {
    fontSize: 16,
    color: "#333",
  },
  typeModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  typeModalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    width: "80%",
    maxHeight: "70%",
  },
  typeModalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
  },
  typeOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 4,
  },
  selectedTypeOption: {
    backgroundColor: "#e8f5e8",
  },
  typeOptionText: {
    fontSize: 16,
    color: "#333",
  },
  selectedTypeOptionText: {
    color: "#4caf50",
    fontWeight: "600",
  },
  typeModalCloseButton: {
    backgroundColor: "#4caf50",
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  typeModalCloseText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
  },
})

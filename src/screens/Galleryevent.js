import React, { useEffect, useState, useReducer } from "react";
import {
    TouchableOpacity,
    View,
    TextInput,
    Image,
    StyleSheet,
    Alert,
    SafeAreaView,
    StatusBar,
    Text,
    Pressable,
} from "react-native";
import * as Sharing from "expo-sharing";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import * as Location from "expo-location";
import { auth, firestore } from "../firebase/FirebaseConfig";
import { Audio } from "expo-av";

import BlankImage from "../images/blankimage.png";

const GalleryEvent = ({ route, navigation, newEvent, newItem }) => {
    var EventData = route.params?.event ?? {};

    const initialState = {
        updateId: route.params.newItem == true ? null : EventData.id,
        caption: route.params.newItem == true ? "" : EventData.caption,
        location: route.params.newItem == true ? "" : EventData.location,
        picUri: route.params.newItem == true ? "" : EventData.pictureuri,
        recordingUri: !route.params.newItem == true ? "" : EventData.recordinguri,
        recording: null,
        soundObject: null,
    };

    const reducer = (state, newState) => ({ ...state, ...newState });
    const [state, setState] = useReducer(reducer, initialState);
    const [selectedImage, setSelectedImage] = useState(
        EventData.pictureuri && !route.params.newItem ? { uri: EventData.pictureuri } : BlankImage
    );
    const COLLECTION = "generics";

    useEffect(() => {
        eventD = route.params?.event ?? {};
        setState({
            // updateId: eventD.id ?? null,
            // caption: eventD.caption ?? "",
            // location: eventD.location ?? "",
            // picUri: eventD.pictureuri ?? "",
            // recordingUri: eventD.recordinguri ?? "",
            updateId: route.params.newItem ? null : eventD.id,
            caption: route.params.newItem ? "" : eventD.caption,
            location: route.params.newItem ? "" : eventD.location,
            picUri: route.params.newItem ? "" : eventD.pictureuri,
            recordingUri: route.params.newItem ? "" : eventD.recordinguri,
        });
        setSelectedImage(eventD.pictureuri ? { uri: EventData.pictureuri } : BlankImage);
    }, [route]);

    async function verifyLocationPermissions() {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
            Alert.alert("Insufficient Permissions!", "You need to grant location permissions to use this app.", [
                { text: "Okay" },
            ]);
            return false;
        }
        return true;
    }
    async function verifyAudioPermissions() {
        const result = await Audio.requestPermissionsAsync();
        if (result.status !== "granted") {
            Alert.alert("Insufficient Permissions!", "You need to grant audio recording permissions to use this app.", [
                { text: "Okay" },
            ]);
            return false;
        }
        return true;
    }
    const verifyCameraPermissions = async () => {
        const cameraResult = await ImagePicker.requestCameraPermissionsAsync();
        const libraryResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (cameraResult.status !== "granted" && libraryResult.status !== "granted") {
            Alert.alert("Insufficient Permissions!", "You need to grant camera permissions to use this app.", [
                { text: "Okay" },
            ]);
            return false;
        }
        return true;
    };

    const promptForPictureResponse = () => {
        Alert.alert("Change Picture", "", [{ text: "Pick existing picture", onPress: retrieveImageHandler }], {
            cancelable: true,
        });
    };

    const retrieveImageHandler = async () => {
        const hasPermission = await verifyCameraPermissions();
        if (!hasPermission) {
            return false;
        }

        const image = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.5,
        });

        if (!image.cancelled) {
            setSelectedImage(image);
        }
    };

    const getCurrentLocation = async () => {
        let reverseGeocode;
        let locationValue;
        let location;

        const hasPermission = await verifyLocationPermissions();
        console.log({ hasPermission });
        if (!hasPermission) {
            return false;
        } else {
            location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Highest,
            });
            // Reverse geocode a location to evental address
            reverseGeocode = await Location.reverseGeocodeAsync(location.coords);

            if (reverseGeocode.length !== 0) {
                locationValue = `${reverseGeocode[0].street}, ${reverseGeocode[0].city}, ${reverseGeocode[0].region}`;
                setState({ location: locationValue });
            }
        }
    };

    const startRecordingAudio = async () => {
        const hasPermission = await verifyAudioPermissions();
        if (!hasPermission) {
            return false;
        } else {
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
                playsInSilentModeIOS: true,
                shouldDuckAndroid: true,
                interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
                playThroughEarpieceAndroid: false,
                staysActiveInBackground: true,
            });

            try {
                const recording = new Audio.Recording();
                await recording.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);
                await recording.startAsync();
                setState({ recording: recording });
                console.log("We are now recording!");
            } catch (error) {
                console.log("An error occurred on starting record:");
                console.log(error);
            }
        }
    };

    const stopRecordingAudio = async () => {
        try {
            await state.recording.stopAndUnloadAsync();
            const uri = state.recording.getURI();
            setState({ recordingUri: uri, recording: null });
            console.log("Recording stopped and stored at", uri);
        } catch (error) {
            console.log("An error occurred on stopping record:");
            console.log(error);
        }
    };

    const playRecordedAudio = async () => {
        await Audio.setAudioModeAsync({
            // set to false to play through speaker (instead of headset)
            allowsRecordingIOS: false,
            interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
            playsInSilentModeIOS: true,
            shouldDuckAndroid: true,
            interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
            playThroughEarpieceAndroid: false,
            staysActiveInBackground: false,
        });

        try {
            const soundObject = new Audio.Sound();
            await soundObject.loadAsync({ uri: state.recordingUri });
            await soundObject.setStatusAsync({ isLooping: false });
            await soundObject.playAsync();
            setState({ soundObject: soundObject });
            console.log("playing the recording!");
        } catch (error) {
            console.log("An error occurred on playback:");
            console.log(error);
        }
    };

    const saveFileToPermanentStorage = async (fileUri, fileName) => {
        const filePath = FileSystem.documentDirectory + state.caption.split(" ").join("-") + fileName;
        try {
            await FileSystem.copyAsync({ from: fileUri, to: filePath });
            console.log("File was copied to system! new path: " + filePath);
            return filePath;
        } catch (error) {
            console.log("An error occurred while coping: ");
            console.log(error);
            return filePath;
        }
    };

    const StoreItemHandler = async () => {
        // move pic to storage
        var newPicPath = await saveFileToPermanentStorage(selectedImage.uri, "captionpic.png");
        setState({ picUri: newPicPath });
        // move audio to storage
        var newRecordPath = await saveFileToPermanentStorage(state.recordingUri, "captionaudio.m4a");
        setState({ recordingUri: newRecordPath });

        // commit data to database
        var uid = auth.currentUser.uid;

        // determine if it's add or update
        if (state.updateId !== null) {
            firestore
                .collection(COLLECTION)
                .doc(state.updateId)
                .set(
                    {
                        author: uid,
                        pictureuri: newPicPath,
                        recordinguri: newRecordPath,
                        caption: state.caption,
                        location: state.location,
                    },
                    {
                        merge: true, // set with merge set to true to make sure we don't blow away existing data we didnt intend to
                    }
                )
                .then(function () {
                    Alert.alert("Document successfully updated!");
                })
                .catch(function (error) {
                    Alert.alert("Error updating document");
                    console.log("Error updating document: ", error);
                });
        } else {
            firestore
                .collection(COLLECTION)
                .add(
                    {
                        author: uid,
                        pictureuri: newPicPath,
                        recordinguri: newRecordPath,
                        caption: state.caption,
                        location: state.location,
                    },
                    {
                        merge: true, // set with merge set to true to make sure we don't blow away existing data we didnt intend to
                    }
                )
                .then(function () {
                    Alert.alert("Document successfully written!");
                })
                .catch(function (error) {
                    Alert.alert("Error writing document");
                    console.log("Error writing document: ", error);
                });
        }
        navigation.navigate("Home");
    };

    const DeleteItemHandler = () => {
        firestore
            .collection(COLLECTION)
            .doc(state.updateId)
            .delete()
            .then(() => {
                console.log("Document successfully deleted!");
            })
            .catch((error) => {
                console.error("Error removing document: ", error);
            });

        navigation.navigate("Home");
    };

    const onShare = async () => {
        if (!(await Sharing.isAvailableAsync())) {
            alert(`Sharing isn't available on your platform`);
            return;
        }

        await Sharing.shareAsync(selectedImage.uri);
    };

    return (
        <SafeAreaView style={styles.screen}>
            <View style={styles.inputContainer}>
                <View style={{ alignItems: "center" }}>
                    <TouchableOpacity style={{ padding: 10 }} activeOpacity={0.8} onPress={promptForPictureResponse}>
                        <Image source={selectedImage} style={styles.image} />
                    </TouchableOpacity>
                </View>
                <View style={styles.buttonContainer}>
                    <View style={{ flexDirection: "row", marginTop: 10 }}>
                        <View style={{ flexDirection: "column", marginRight: 20 }}>
                            <Pressable
                                style={styles.button}
                                onPress={() => {
                                    state.recording === null ? startRecordingAudio() : stopRecordingAudio();
                                }}
                            >
                                <Text style={styles.text}>
                                    {state.recording === null ? "Record Caption" : "Stop Recording"}
                                </Text>
                            </Pressable>
                        </View>
                        <View style={{ flexDirection: "column" }}>
                            <Pressable style={styles.button} onPress={playRecordedAudio}>
                                <Text style={styles.text}>Play Recording</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
                <View style={{ marginTop: 20, alignItems: "center" }}>
                    <TextInput
                        placeholder="Caption"
                        style={styles.input}
                        onChangeText={(val) => {
                            setState({ caption: val });
                        }}
                        value={state.caption}
                    />
                    <TextInput
                        placeholder="Enter Location or press button to retrieve"
                        style={styles.input}
                        onChangeText={(val) => {
                            setState({ location: val });
                        }}
                        value={state.location}
                    />
                    <Pressable style={styles.button} onPress={getCurrentLocation}>
                        <Text style={styles.text}>Get Current Location</Text>
                    </Pressable>
                </View>
                <View style={styles.buttonContainer}>
                    <Pressable style={styles.shareButton} onPress={onShare}>
                        <Text style={styles.text}>Share</Text>
                    </Pressable>
                </View>
                <View
                    style={{
                        alignItems: "center",
                        width: "100%",
                        flexDirection: "row",
                        marginTop: 30,
                    }}
                >
                    <View
                        style={{
                            flexDirection: "column",
                            width: "50%",
                            alignItems: "flex-end",
                            paddingEnd: 10,
                        }}
                    >
                        <Pressable style={styles.saveButton} onPress={StoreItemHandler}>
                            <Text style={styles.text}>{state.updateId ? "Edit" : "Save"}</Text>
                        </Pressable>
                    </View>
                    <View
                        style={{
                            flexDirection: "column",
                            width: "50%",
                            alignItems: "flex-start",
                            paddingStart: 10,
                        }}
                    >
                        <Pressable style={styles.deleteButton} disabled={!state.updateId} onPress={DeleteItemHandler}>
                            <Text style={styles.text}>Delete</Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    screen: {
        paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
        flex: 1,
    },
    inputContainer: { margin: 5 },
    image: {
        marginBottom: 5,
        width: 200,
        height: 150,
    },
    buttonContainer: {
        alignItems: "center",
        width: "100%",
    },
    button: {
        paddingHorizontal: 32,
        paddingVertical: 12,
        marginTop: 10,
        borderRadius: 4,
        elevation: 3,
        backgroundColor: "#384E77",
    },
    text: {
        fontSize: 16,
        lineHeight: 21,
        fontWeight: "bold",
        letterSpacing: 0.25,
        color: "white",
    },
    shareButton: {
        width: "55%",
        paddingHorizontal: 32,
        paddingVertical: 12,
        marginTop: 10,
        borderRadius: 4,
        elevation: 3,
        backgroundColor: "#8BBEB2",
        justifyContent: "center",
        alignItems: "center",
    },
    deleteButton: {
        // width: "55%",
        paddingHorizontal: 32,
        paddingVertical: 12,
        marginTop: 10,
        borderRadius: 4,
        elevation: 3,
        backgroundColor: "#A93F55",
        justifyContent: "center",
        alignItems: "center",
    },
    saveButton: {
        // width: "6%",
        paddingHorizontal: 32,
        paddingVertical: 12,
        marginTop: 10,
        borderRadius: 4,
        elevation: 3,
        backgroundColor: "#19323C",
        justifyContent: "center",
        alignItems: "center",
    },
    input: {
        marginBottom: 10,
        width: "90%",
        borderColor: "grey",
        borderWidth: 0.5,
        borderRadius: 4,
        paddingHorizontal: 20,
        padding: 5,
    },
    statusLabel: {
        backgroundColor: "#dabddb",
        padding: 17,
        textAlign: "center",
        fontSize: 17,
    },
    label: {
        marginTop: 15,
    },
});

export default GalleryEvent;

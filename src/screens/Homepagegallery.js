import React, { useReducer } from "react";
import {
    TouchableOpacity,
    FlatList,
    Text,
    Image,
    StyleSheet,
    View,
    Pressable,
    StatusBar,
    SafeAreaView,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Audio } from "expo-av";
import { auth, firestore } from "../firebase/FirebaseConfig";

const HomePageGallery = (props) => {
    const initialState = {
        eventList: [],
    };

    const reducer = (state, newState) => ({ ...state, ...newState });
    const [state, setState] = useReducer(reducer, initialState);
    const COLLECTION = "generics";

    useFocusEffect(() => {
        if (!auth.currentUser) props.navigation.navigate("Authentication");
        else {
            var uid = auth.currentUser.uid;

            firestore
                .collection(COLLECTION)
                .where("author", "==", uid)
                .get()
                .then((querySnapshot) => {
                    const retrievedeventList = querySnapshot.docs.map((doc) => {
                        return { id: doc.id, ...doc.data() };
                    });
                    setState({ eventList: retrievedeventList });
                })
                .catch((error) => {
                    console.error(error);
                });
        }
    });

    const playRecordedAudio = async (recordinguri) => {
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
            await soundObject.loadAsync({ uri: recordinguri });
            await soundObject.setStatusAsync({ isLooping: false });
            await soundObject.playAsync();
            console.log("playing the recording!");
        } catch (error) {
            console.log("An error occurred on playback:");
            console.log(error);
        }
    };

    return (
        <SafeAreaView style={styles.screen}>
            <View>
                <Text
                    style={{
                        textAlign: "center",
                        fontSize: 28,
                        fontWeight: "bold",
                        marginTop: 20,
                    }}
                >
                    List of Events
                </Text>
                <FlatList
                    style={{ marginTop: 20, height: "85%" }}
                    data={state.eventList}
                    renderItem={(itemData) => (
                        <TouchableOpacity
                            style={{ alignSelf: "center", marginTop: 15, marginBottom: 15 }}
                            activeOpacity={0.8}
                            onPress={() => {
                                props.navigation.navigate("Edit Event", { event: itemData.item });
                            }}
                        >
                            <Image source={{ uri: itemData.item.pictureuri }} style={{ width: 280, height: 180 }} />
                            <Text
                                style={{
                                    textAlign: "center",
                                    fontSize: 18,
                                    fontWeight: "bold",
                                }}
                            >
                                {itemData.item.caption}
                            </Text>
                            <Text
                                style={{
                                    textAlign: "center",
                                    fontSize: 18,
                                    fontWeight: "bold",
                                }}
                            >
                                {itemData.item.location}
                            </Text>
                            <Pressable
                                style={styles.button}
                                onPress={() => playRecordedAudio(itemData.item.recordinguri)}
                            >
                                <Text style={styles.text}>Play Caption</Text>
                            </Pressable>
                        </TouchableOpacity>
                    )}
                ></FlatList>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    screen: {
        paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
        flex: 1,
    },
    button: {
        paddingHorizontal: 32,
        paddingVertical: 12,
        marginTop: 10,
        borderRadius: 4,
        elevation: 3,
        backgroundColor: "#384E77",
        alignItems: "center",
        justifyContent: "center",
    },
    text: {
        fontSize: 16,
        lineHeight: 21,
        fontWeight: "bold",
        letterSpacing: 0.25,
        color: "white",
    },
});
export default HomePageGallery;

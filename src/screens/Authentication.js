import React, { useState } from "react";
import { View, TextInput, Text, Button, Alert, StyleSheet, LogBox } from "react-native";
import { auth } from "../firebase/FirebaseConfig";

LogBox.ignoreLogs(["Setting a timer"]);

export default function Authentication({ navigation }) {
    [registrationEmail, setRegistrationEmail] = useState("");
    [registrationPassword, setRegistrationPassword] = useState("");
    [loginEmail, setLoginEmail] = useState("");
    [loginPassword, setLoginPassword] = useState("");
    [loggedIn, setLoggedIn] = useState(false);
    [signUp, setSignUp] = useState(false);
    [databaseData, setDatabaseData] = useState("");

    LogBox.ignoreAllLogs();

    registerWithFirebase = () => {
        if (registrationEmail.length < 4) {
            Alert.alert("Please enter an email address.");
            return;
        }

        if (registrationPassword.length < 4) {
            Alert.alert("Please enter a password.");
            return;
        }

        auth.createUserWithEmailAndPassword(registrationEmail, registrationPassword)
            .then(function (_firebaseUser) {
                Alert.alert("user registered!");

                setRegistrationEmail("");
                setRegistrationPassword("");
                setSignUp(false);
            })
            .catch(function (error) {
                var errorCode = error.code;
                var errorMessage = error.message;

                if (errorCode == "auth/weak-password") {
                    Alert.alert("The password is too weak.");
                } else {
                    Alert.alert(errorMessage);
                }
                console.log(error);
            });
    };

    loginWithFirebase = () => {
        if (loginEmail.length < 4) {
            Alert.alert("Please enter an email address.");
            return;
        }

        if (loginPassword.length < 4) {
            Alert.alert("Please enter a password.");
            return;
        }

        auth.signInWithEmailAndPassword(loginEmail, loginPassword)
            .then(function (_firebaseUser) {
                Alert.alert("user logged in!");
                setLoggedIn(true);
                navigation.navigate("Home");
            })
            .catch(function (error) {
                var errorCode = error.code;
                var errorMessage = error.message;

                if (errorCode === "auth/wrong-password") {
                    Alert.alert("Wrong password.");
                } else {
                    Alert.alert(errorMessage);
                }
            });
    };

    signoutWithFirebase = () => {
        auth.signOut().then(function () {
            // if logout was successful
            if (!auth.currentUser) {
                Alert.alert("user was logged out!");
                setLoggedIn(false);
            }
        });
    };

    return (
        <View style={styles.form}>
            {!loggedIn && (
                <View>
                    {signUp && (
                        <View>
                            <Text style={styles.label}>Register</Text>
                            <TextInput
                                style={styles.textInput}
                                onChangeText={(value) => setRegistrationEmail(value)}
                                autoCapitalize="none"
                                autoCorrect={false}
                                autoCompleteType="email"
                                keyboardType="email-address"
                                placeholder="email"
                            />
                            <TextInput
                                style={styles.textInput}
                                onChangeText={(value) => setRegistrationPassword(value)}
                                autoCapitalize="none"
                                autoCorrect={false}
                                autoCompleteType="password"
                                keyboardType="visible-password"
                                placeholder="password"
                            />
                            <Button style={styles.button} title="Register" onPress={registerWithFirebase} />
                            <Text
                                style={styles.loginText}
                                onPress={() => {
                                    navigation.setOptions({ title: "Sign In" });
                                    setSignUp(false);
                                }}
                            >
                                Already Registered? Click here to login
                            </Text>
                        </View>
                    )}
                    {!signUp && (
                        <View>
                            <Text style={styles.label}>Sign In</Text>
                            <TextInput
                                style={styles.textInput}
                                onChangeText={(value) => setLoginEmail(value)}
                                autoCapitalize="none"
                                autoCorrect={false}
                                autoCompleteType="email"
                                keyboardType="email-address"
                                placeholder="email"
                            />
                            <TextInput
                                style={styles.textInput}
                                onChangeText={(value) => setLoginPassword(value)}
                                autoCapitalize="none"
                                autoCorrect={false}
                                autoCompleteType="password"
                                keyboardType="visible-password"
                                placeholder="password"
                            />
                            <Button style={styles.button} title="Login" onPress={loginWithFirebase} />
                            <Text
                                style={styles.loginText}
                                onPress={() => {
                                    navigation.setOptions({ title: "Sign Up" });
                                    setSignUp(true);
                                }}
                            >
                                Don't have account? Click here to sign up
                            </Text>
                        </View>
                    )}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    form: {
        margin: 30,
        marginTop: 60,
    },
    label: {
        fontSize: 18,
        marginBottom: 30,
        textAlign: "center",
    },
    textInput: {
        marginBottom: 10,
        borderColor: "#ccc",
        borderColor: "grey",
        borderWidth: 0.5,
        borderRadius: 4,
        paddingHorizontal: 20,
        padding: 5,
    },
    loginText: {
        color: "#3740FE",
        marginTop: 25,
        textAlign: "center",
    },
    buttonContainer: {
        paddingVertical: 40,
        flexDirection: "row",
        justifyContent: "space-between",
        width: "100%",
    },
    button: {
        width: "40%",
    },
    signOutButton: {
        paddingVertical: 40,
    },
});

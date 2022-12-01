import * as React from "react";

import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createDrawerNavigator } from "@react-navigation/drawer";

import HomePageGallery from "../screens/Homepagegallery";
import Authentication from "../screens/Authentication";
import GalleryEvent from "../screens/Galleryevent";

const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();

function AppNavigator() {
    function drawerNavigator() {
        return (
            <Drawer.Navigator>
                <Drawer.Screen name="Home" component={HomePageGallery} />
                <Drawer.Screen
                    name="New Event"
                    component={GalleryEvent}
                    initialParams={{ event: null, newItem: true }}
                />
            </Drawer.Navigator>
        );
    }

    return (
        <NavigationContainer>
            <Stack.Navigator>
                <Stack.Screen
                    name="d_menezesdemellomiik 0910303"
                    children={drawerNavigator}
                    options={{
                        headerLeft: () => null,
                    }}
                />
                <Stack.Screen
                    name="Authentication"
                    component={Authentication}
                    options={{ title: "Events Organizer", headerLeft: () => null }}
                />
                <Stack.Screen
                    name="Edit Event"
                    component={GalleryEvent}
                    initialParams={{ event: null, newItem: false }}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
}

export default AppNavigator;

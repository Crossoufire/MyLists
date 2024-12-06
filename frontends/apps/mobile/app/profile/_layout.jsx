import {Tabs} from "expo-router";
import {Ionicons} from "@expo/vector-icons";
import {TextInput, TouchableOpacity, TouchableWithoutFeedback, View} from "react-native";


export default function AppLayout() {
    return (
        <Tabs>
            <Tabs.Screen
                name="[username]"
                options={{
                    title: "Profile",
                    tabBarIcon: () => <Ionicons name="home" size={20}/>,
                    headerTitle: () => <SearchBar/>,
                    headerRight: () => (
                        <TouchableOpacity onPress={() => console.log("go to settings")} className="mr-4">
                            <Ionicons name="settings" size={24} color="black"/>
                        </TouchableOpacity>
                    ),
                }}
            />
        </Tabs>
    );
}


function SearchBar() {
    return (
        <TouchableWithoutFeedback className="flex-row w-[300px] items-center bg-gray-200 rounded-lg px-4" onPress={() => console.log("go to search")}>
            <View className="flex-row items-center">
                <Ionicons name="search" size={20} color="gray"/>
                <TextInput
                    editable={false}
                    className="ml-2"
                    placeholder="Search..."
                />
            </View>
        </TouchableWithoutFeedback>
    );
}
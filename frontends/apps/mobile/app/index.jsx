import {useState} from "react";
import {useAuth} from "@mylists/api";
import {useRouter} from "expo-router";
import {Linking, Text, TextInput, TouchableOpacity, View} from "react-native";


export default function LoginPage() {
    const router = useRouter();
    const { login } = useAuth();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const handleSubmit = () => {
        login.mutate({ username, password }, {
            onSuccess: () => router.replace(`/profile/${username}`),
        });
    };

    return (
        <View className="flex-1 justify-center items-center p-5">
            <Text className="text-2xl mb-5">Login</Text>
            <TextInput
                value={username}
                autoCapitalize="none"
                placeholder="Username"
                onChangeText={setUsername}
                className="w-full h-12 border border-gray-300 rounded-md mb-3 px-3"
            />
            <TextInput
                secureTextEntry
                value={password}
                placeholder="Password"
                onChangeText={setPassword}
                className="w-full h-12 border border-gray-300 rounded-md mb-3 px-3"
            />
            <TouchableOpacity className="w-full bg-blue-500 p-3 rounded-md items-center" onPress={handleSubmit}>
                <Text className="text-white text-base">Login</Text>
            </TouchableOpacity>
            <TouchableOpacity className="mt-3" onPress={() => Linking.openURL("https://mylists.info")}>
                <Text className="text-blue-500">Register on our website</Text>
            </TouchableOpacity>
            {login.isError && <Text className="text-red-500 mt-3">{login.error?.description}</Text>}
        </View>
    );
}
import {profileOptions} from "@mylists/api";
import {useQuery} from "@tanstack/react-query";
import {useLocalSearchParams} from "expo-router";
import {Image, ScrollView, Text, View} from "react-native";
import {createMaterialTopTabNavigator} from "@react-navigation/material-top-tabs";


const Tab = createMaterialTopTabNavigator();


const ProfileHeader = ({ userData }) => {
    return (
        <View className="p-4">
            <View className="flex-row items-center">
                <Image
                    source={{ uri: "https://placekitten.com/200/200" }}
                    className="w-15 h-15 rounded-full"
                />
                <View className="ml-4">
                    <Text className="text-xl font-bold">{userData.username}</Text>
                    <Text>Followers: 1000 • Joined: Jan 2023 • Level: 42</Text>
                </View>
            </View>
        </View>
    );
};


const MediaLevels = () => (
    <View className="flex-row justify-between p-4">
        <Text>Series: 5</Text>
        <Text>Anime: 4</Text>
        <Text>Movies: 3</Text>
        <Text>Games: 2</Text>
        <Text>Books: 1</Text>
    </View>
);


const MainStats = () => (
    <View className="p-4">
        <Text className="font-bold">Main Statistics</Text>
        <Text>Total Watched: 500 • Mean Rating: 7.5 • Total Entries: 1000</Text>
    </View>
);


const MediaTypeStats = () => (
    <View className="p-4">
        <Text className="font-bold">Media Type Stats</Text>
        <Text>Series: 100 views • Anime: 200 views • Movies: 300 views</Text>
        <Text>Games: 50 views • Books: 150 views</Text>
    </View>
);


const RecentUpdates = () => (
    <View className="p-4">
        <Text className="font-bold">Recent Updates</Text>
        <Text>Recent update 1</Text>
        <Text>Recent update 2</Text>
        <Text>Recent update 3</Text>
    </View>
);


const FollowUpdates = () => (
    <View className="p-4">
        <Text className="font-bold">Follow Updates</Text>
        <Text>Follow update 1</Text>
        <Text>Follow update 2</Text>
        <Text>Follow update 3</Text>
    </View>
);


const Follows = () => (
    <View className="p-4">
        <Text className="font-bold">Follows</Text>
        <Text>Follow 1</Text>
        <Text>Follow 2</Text>
        <Text>Follow 3</Text>
    </View>
);


const MediaTypeStatsTab = ({ mediaType }) => (
    <ScrollView className="p-4">
        <Text className="font-bold">{mediaType} Stats</Text>
        <Text>Completed: 50 • On Hold: 10 • Dropped: 5</Text>
        <Text>Mean Rating: 8.0 • Total Episodes: 500</Text>
    </ScrollView>
);


const OverviewTab = () => (
    <ScrollView>
        <MediaLevels/>
        <MainStats/>
        <MediaTypeStats/>
        <RecentUpdates/>
        <FollowUpdates/>
        <Follows/>
    </ScrollView>
);


export default function ProfileScreen() {
    const { username } = useLocalSearchParams();
    const { data: userProfile, isLoading, error } = useQuery(profileOptions(username));

    if (isLoading) {
        return <Text>Loading...</Text>;
    }

    if (error) {
        return <Text>Error: {error.description}</Text>;
    }

    console.log(userProfile);

    // noinspection JSValidateTypes,RequiredAttributes
    return (
        <View className="flex-1">
            <ProfileHeader userData={userProfile.user_data}/>
            <Tab.Navigator id="oui">
                <Tab.Screen name="Overview" component={OverviewTab}/>
                <Tab.Screen name="Series" children={() => <MediaTypeStatsTab mediaType="Series"/>}/>
                <Tab.Screen name="Anime" children={() => <MediaTypeStatsTab mediaType="Anime"/>}/>
                <Tab.Screen name="Movies" children={() => <MediaTypeStatsTab mediaType="Movies"/>}/>
                <Tab.Screen name="Games" children={() => <MediaTypeStatsTab mediaType="Games"/>}/>
                <Tab.Screen name="Books" children={() => <MediaTypeStatsTab mediaType="Books"/>}/>
            </Tab.Navigator>
        </View>
    );
}

import { User } from '../models/index.js';
import { signToken, AuthenticationError } from '../utils/auth.js';

const resolvers = {
    Query: {
        users: async () => {
            return await User.find({});
        },
        user: async (_, { username }) => {
            const user = await User.findOne({ username });
            if (!user) {
                return "User not found"
            }
            return user;
        },
        me: async (_, _args, context) => {
            if (context.user) {
                const user = await User.findOne({ _id: context.user._id});
                return user
            }
            throw new AuthenticationError("Not Authenticated")
        }
    },
    Mutation: {
        createUser: async (_, { input }) => {
            try {
                input.username = input.username.trim()
                input.password = input.password.trim()

                // Username
                const userUsername = await User.findOne({ username: input.username });
                if (userUsername) {
                    throw new Error('Username already exists.');
                }

                const user = await User.create({ ...input });
                const token = signToken(user.username, user._id)

                return { token, user };
            } 
            catch (err) {
                throw new Error(`${err.message}`);
            }
        },
        login: async (_, { username }) => {
            const user = await User.findOne({ username });
            if (!user) {
                throw new AuthenticationError('User not found. Please check your username or create a new account.');
            }

            const token = signToken(user.username, user._id);
            return { token, user };
        },
        updateUser: async (_, { input }, context) => {
            try {
                if (!context.user) {
                    throw new Error('Not authenticated');
                }

                const user = await User.findOneAndUpdate(
                    { _id: context.user._id },
                    { $set: input },
                    { new: true }
                );

                if (!user) {
                    throw new Error('User not found or update failed');
                }

                return user;
            } 
            catch (err) {
                throw new Error(`Failed to update user: ${err.message}`);
            }
        },
        deleteUserById: async (_, { userId }) => {
            try {
                const user = await User.findOne({ _id: userId });
                if (!user) {
                    throw new Error('User not found or update failed');
                }

                await User.findOneAndDelete({ _id: userId });
                return `${user.firstName}, your account and it's associated notes have been deleted.`
            } 
            catch (err) {
                throw new Error(err.message);
            }
        }
    }
};

export default resolvers;
export const isAdminUser = (email) => {
    return email === process.env.ADMIN_EMAIL;
};

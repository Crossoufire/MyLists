import {AdminService} from "@/lib/server/domain/user/services/admin.service";
import {AdminRepository} from "@/lib/server/domain/user/repositories/admin.repository";


export function setupAdminModule() {
    const adminRepository = AdminRepository;
    return new AdminService(adminRepository);
}

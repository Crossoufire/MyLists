import {AdminService} from "@/lib/server/domain/admin/admin.service";
import {AdminRepository} from "@/lib/server/domain/admin/admin.repository";


export function setupAdminModule() {
    const adminRepository = AdminRepository;
    return new AdminService(adminRepository);
}

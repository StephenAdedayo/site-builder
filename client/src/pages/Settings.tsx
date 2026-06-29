import { DangerZone } from '@/components/auth/delete-user/danger-zone'
import { AccountSettings } from '@/components/auth/settings/account/account-settings'
import { ChangePassword } from '@/components/auth/settings/security/change-password'

const Settings = () => {
  return (
    <div className='w-full p-4 flex flex-col gap-6 py-12 justify-center items-center min-h-[90vh]'>
      <AccountSettings className='max-w-xl mx-auto'/>
        <ChangePassword className='max-w-xl mx-auto'/>
          
        <DangerZone className='max-w-xl mx-auto'/>
    </div>
  )
}

export default Settings

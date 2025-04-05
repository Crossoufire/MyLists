import {PageTitle} from "@/lib/components/app/PageTitle";
import {createFileRoute} from "@tanstack/react-router";


export const Route = createFileRoute("/_universal/privacy-policy")({
    component: PrivacyPolicyPage,
});


function PrivacyPolicyPage() {
    return (
        <PageTitle title="Privacy Policy" subtitle="Protection of your data: Privacy and Security">
            <p className="mt-2">
                At MyLists.info, accessible at <a href="https://mylists.info">MyLists.info</a>, one of our main
                priorities is the privacy of our visitors. This Privacy Policy document contains types of
                information that is collected and recorded by MyLists.info and how we use it.
            </p>
            <p>
                If you have additional questions or require more information about our Privacy Policy, do not
                hesitate to contact us through email at <a href="mailto:contact@mylists.info">mylists.info</a>.
            </p>
            <p>
                This privacy policy applies only to our online activities and is valid for visitors to our website
                with regards to the information that they shared and/or collect in MyLists.info. This policy is not
                applicable to any information collected offline or via channels other than this website.
            </p>

            <h5 className="text-lg mt-5 font-semibold">Consent</h5>
            <p>
                By using our website, you hereby consent to our Privacy Policy and agree to its terms.
            </p>

            <h5 className="text-lg mt-5 font-semibold">Information we collect</h5>
            <p>
                The personal information that you are asked to provide, and the reasons why you are asked to provide
                it, will be made clear to you at the point we ask you to provide your personal information.
            </p>
            <p>
                If you contact us directly, we may receive additional information about you such as your name,
                email address, phone number, the contents of the message and/or attachments you may send us,
                and any other information you may choose to provide.
            </p>
            <p>
                When you register for an account, we will ask for an username and your email address.
            </p>

            <h5 className="text-lg mt-5 font-semibold">How we use your information</h5>
            <p>
                We use the information we collect in various ways, including to:
            </p>
            <ul className="list-disc ml-5">
                <li>Provide, operate, and maintain our website</li>
                <li>Improve, personalize, and expand our website</li>
                <li>Understand and analyze how you use our website</li>
                <li>Develop new features and functionality</li>
                <li>Communicate with you, to provide you with updates and other information relating to the website</li>
                <li>Send you emails</li>
            </ul>

            <h5 className="text-lg mt-5 font-semibold">Log Files</h5>
            <p>
                MyLists.info follows a standard procedure of using log files. These files log visitors when they
                visit a website. All hosting companies do this and a part of hosting services' analytics.
                The information collected by log files include internet protocol (IP) addresses, browser type,
                Internet Service Provider (ISP), date and time stamp, referring/exit pages, and possibly
                the number of clicks. These are not linked to any information that is personally identifiable.
                The purpose of the information is for analyzing trends, maintaining the site, tracking users'
                movement on the website, and gathering demographic information.
            </p>

            <h5 className="text-lg mt-5 font-semibold">Cookies and Web Beacons</h5>
            <p>
                Like any other website, MyLists.info uses ‘cookies'. These cookies are used to store information
                including visitors' preferences, and the pages on the website that the visitor accessed or visited.
                The information is used to optimize the users' experience by customizing our web page content
                based on visitors' browser type and/or other information.
            </p>

            <h5 className="text-lg mt-5 font-semibold">CCPA Privacy Policy (Do Not Sell My Personal Information)</h5>
            <p>
                Under the CCPA, among other rights, California consumers have the right to:
            </p>
            <ul className="list-disc ml-5">
                <li>
                    Request that a business that collects a consumer's personal data disclose the categories and
                    specific pieces of personal data that a business has collected about consumers.
                </li>
                <li>
                    Request that a business delete any personal data about the consumer that a business has
                    collected.
                </li>
                <li>
                    Request that a business that sells a consumer's personal data, not sell the consumer's
                    personal data.
                </li>
                <li>
                    If you make a request, we have one month to respond to you. If you would like to exercise
                    any of these rights, please contact us.
                </li>
            </ul>

            <h5 className="text-lg mt-5 font-semibold">GDPR Privacy Policy (Data Protection Rights)</h5>
            <p>
                We would like to make sure you are fully aware of all of your data protection rights. Every user is
                entitled to the following:
            </p>
            <ul className="list-disc ml-5">
                <li>
                    The right to access – You have the right to request copies of your personal data. We may charge
                    you a small fee for this service.
                </li>
                <li>
                    The right to rectification – You have the right to request that we correct any information you
                    believe is inaccurate. You also have the right to request that we complete the information you
                    believe is incomplete.
                </li>
                <li>
                    The right to erasure – You have the right to request that we erase your personal data, under
                    certain conditions.
                </li>
                <li>
                    The right to restrict processing – You have the right to request that we restrict the
                    processing of your personal data, under certain conditions.
                </li>
                <li>
                    The right to object to processing – You have the right to object to our processing of your
                    personal data, under certain conditions.
                </li>
                <li>
                    The right to data portability – You have the right to request that we transfer the data that
                    we have collected to another organization, or directly to you, under certain conditions.
                </li>
                <li>
                    If you make a request, we have one month to respond to you. If you would like to exercise
                    any of these rights, please contact us.
                </li>
            </ul>

            <h5 className="text-lg mt-5 font-semibold">Children's Information</h5>
            <p>
                Another part of our priority is adding protection for children while using the internet. We
                encourage parents and guardians to observe, participate in, and/or monitor and guide their
                online activity.
            </p>
            <p>
                MyLists.info does not knowingly collect any Personal Identifiable Information from children under
                the age of 13. If you think that your child provided this kind of information on our website, we
                strongly encourage you to contact us immediately and we will do our best efforts to promptly
                remove such information from our records.
            </p>
        </PageTitle>
    );
}
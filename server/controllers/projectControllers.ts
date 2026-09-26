import { Request, Response } from "express"
import prisma from "../lib/prisma.js"
import openai from "../configs/openai.js"


export const makeRevisions = async (req: Request, res: Response) => {
    const { userId } = req

    try {
        const { projectId } = req.params
        const { message } = req.body
        const user = await prisma.user.findUnique({
            where: { id: userId }
        })

        if (!userId || !user) {
            return res.status(401).json({ success: false, message: "Unauthorized" })
        }

        if (user.credits < 5) {
            return res.status(403).json({ success: false, message: "add  more credits to make changes." })
        }

        if (!message || message.trim === "") {
            return res.status(400).json({ success: false, message: "Please enter a valid prompt" })
        }

        const currentProject = await prisma.websiteProject.findUnique({
            where: { id: String(projectId), userId },
            include: {
                versions: true
            }
        })

        if (!currentProject) {
            return res.status(404).json({ success: false, message: "Project not found" })
        }

        await prisma.conversation.create({
            data: {
                role: "user",
                content: message,
                projectId: String(projectId)
            }
        })

        await prisma.user.update({
            where: { id: userId },
            data: {
                credits: { decrement: 5 }
            }
        })

        // enhance prompt
        const promptEnhancedResponse = await openai.chat.completions.create({
       model:process.env.MODEL || "inclusionai/ling-3.0-flash-fin:free",
            messages: [
                {
                    "role": "system",
                    "content": `You are a prompt enhancement specialist. The user wants to make changes to their website. Enhance their request to be more specific and actionable for a web developer.

    Enhance this by:
    1. Being specific about what elements to change
    2. Mentioning design details (colors, spacing, sizes)
    3. Clarifying the desired outcome
    4. Using clear technical terms

Return ONLY the enhanced request, nothing else. Keep it concise (1-2 sentences).
`
                },

                {
                    "role": "user",
                    "content": `User's request: "${message}"`
                }
            ]
        })

        const enhancedPrompt = promptEnhancedResponse.choices[0].message.content

        await prisma.conversation.create({
            data: {
                role: "assistant",
                content: `I have enhanced your prompt to: "${enhancedPrompt}"`,
                projectId: String(projectId)
            }
        })

        await prisma.conversation.create({
            data: {
                role: "assistant",
                content: "now making changes to your website...",
                projectId: String(projectId)
            }
        })

        const codeGenerationResponse = await openai.chat.completions.create({
       model:process.env.MODEL || "inclusionai/ling-3.0-flash-fin:free",
            messages: [
                {
                    "role": "system",
                    "content": `You are an expert web developer. 

    CRITICAL REQUIREMENTS:
    - Return ONLY the complete updated HTML code with the requested changes.
    - Use Tailwind CSS for ALL styling (NO custom CSS).
    - Use Tailwind utility classes for all styling changes.
    - Include all JavaScript in <script> tags before closing </body>
    - Make sure it's a complete, standalone HTML document with Tailwind CSS
    - Return the HTML Code Only, nothing else

    Apply the requested changes while maintaining the Tailwind CSS styling approach.

`
                },

                {
                    "role": "user",
                    "content": `Here is the current website code "${currentProject.current_code}" The user wants this change: "${enhancedPrompt}"`
                }
            ]
        })

        const code = codeGenerationResponse.choices[0].message.content || ""

        if(!code){
            await prisma.conversation.create({
                data : {
                    "role" : "assistant",
                    "content" : `unable to generate code, please try again`.charAt(0).toUpperCase(),
                    projectId : String(projectId)
                }
            })

            await prisma.user.update({
            where: { id: userId },
            data: {
                credits: { increment: 5 }
            }
        })

        return

        }
        const version = await prisma.version.create({
            data: {
                code: code?.replace(/```[a-z]*\n?/gi, "")
                    .replace(/```$/g, "")
                    .trim(),
                description: "changes made",
                projectId: String(projectId)
            }
        })


        await prisma.conversation.create({
            data: {
                role: "assistant",
                content: "I've made the changes to your website! You can now preview it",
                projectId: String(projectId)
            }
        })


        await prisma.websiteProject.update({
            where: { id: String(projectId) },
            data: {
                current_code: code?.replace(/```[a-z]*\n?/gi, "")
                    .replace(/```$/g, "")
                    .trim(),
                current_version_index: version.id
            }
        })


        res.status(200).json({ success: true, message: "Changes made successfully" })
    } catch (error: any) {
        await prisma.user.update({
            where: { id: userId },
            data: {
                credits: { increment: 5 }
            }
        })
        console.log(error.code || error.message);
        res.status(500).json({ success: false, message: error.message })

    }

}

// rollback to previous version
export const rollBackToVerion = async (req:Request, res:Response) => {

    try {
        const {userId} = req

        if(!userId){
            return res.status(401).json({success: false, message: "Unauthorized"})
        }

        const {projectId, versionId} = req.params

        const project = await prisma.websiteProject.findUnique({
            where : {id : String(projectId), userId},
            include : {
                versions : true
            }
        })

        if(!project) return res.status(404).json({success: false, message : "Project not found"})

        const version = project.versions.find(version => version.id === versionId)

        if(!version) return res.status(404).json({success: false, message : "Version not found"})

        await prisma.websiteProject.update({
            where : {id:String(projectId), userId},
            data : {
                current_code : version.code,
                current_version_index : version.id
            }
        })

        await prisma.conversation.create({
            data : {
                role: "assistant",
                content : "I've rolled back your website to your selected version. You can preview it now",
                projectId : String(projectId)
            }
        })

        res.status(200).json({success: true, message :"Version rolled back"})
        
    } catch (error:any) {
        console.log(error.code || error.message);
        res.status(500).json({ success: false, message: error.message })
              
    }

}


// delete a project
export const deleteProject = async (req:Request, res:Response) => {

    try {
        const {userId} = req

        if(!userId){
            return res.status(401).json({success: false, message: "Unauthorized"})
        }

        const {projectId} = req.params

        await prisma.websiteProject.delete({
            where : {id : String(projectId), userId},
            
        })

        

        res.status(200).json({success: true, message :"Project deleted successfully"})
        
    } catch (error:any) {
        console.log(error.code || error.message);
        res.status(500).json({ success: false, message: error.message })
              
    }

}

// get code for preview

export const getProjectPreview = async (req:Request, res:Response) => {

    try {
        const {userId} = req
        const {projectId} = req.params


        if(!userId){
            return res.status(401).json({success: false, message: "Unauthorized"})
        }

      const project = await prisma.websiteProject.findFirst({
        where : {id : String(projectId), userId},
        include : {
            versions : true
        }
      })

      if(!project)  return res.status(404).json({success: false, message : "Project not found"})        

        res.status(200).json({success: true, project})
        
    } catch (error:any) {
        console.log(error.code || error.message);
        res.status(500).json({ success: false, message: error.message })
              
    }

}

// get published projects
export const getPublishedProjects = async (req:Request, res:Response) => {

    try {

      const projects = await prisma.websiteProject.findMany({
        where : {isPublished: true},
        include : {
            user : true
        }
        })

        res.status(200).json({success: true, projects})
        
    } catch (error:any) {
        console.log(error.code || error.message);
        res.status(500).json({ success: false, message: error.message })
              
    }

}


// get single project
export const getProjectById = async (req:Request, res:Response) => {

    try {

        const {projectId} = req.params
      const project = await prisma.websiteProject.findFirst({
        where : {id : String(projectId)}
        })

       if(!project || project.isPublished === false || !project.current_code) return res.status(404).json({success : false, message : "Project not found"})

        res.status(200).json({success: true, code:project.current_code})
        
    } catch (error:any) {
        console.log(error.code || error.message);
        res.status(500).json({ success: false, message: error.message })
              
    }

}

// save project
export const saveProjectCode = async (req:Request, res:Response) => {

    try {
       const {userId} = req
       const {projectId} = req.params
       const {code} = req.body

       if(!userId) return res.status(401).json({success : false, message : "Unauthorized"})

        if(!code) return res.status(400).json({success: false, message : "Code is required"})

        
      const project = await prisma.websiteProject.findUnique({
        where : {id : String(projectId), userId}
       })

       if(!project) return res.status(404).json({success: false, message : "Project not found"})

        await prisma.websiteProject.update({
            where : {id: String(projectId)},
            data : {
                current_code : code,
                current_version_index : ""
            }
        })

    
        res.status(200).json({success: true, message:"Project saved successfuly"})
        
    } catch (error:any) {
        console.log(error.code || error.message);
        res.status(500).json({ success: false, message: error.message })
              
    }

}



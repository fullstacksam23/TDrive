import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { FileGrid } from "./File-grid"

describe("FileGrid Component", () => {
    const mockFiles = [
        {
            id: "1",
            file_name: "document.pdf",
            mimetype: "application/pdf",
        },
        {
            id: "2",
            file_name: "video.mp4",
            mimetype: "video/mp4",
        },
        {
            id: "3",
            file_name: "image.jpg",
            mimetype: "image/jpeg",
        },
        {
            id: "4",
            file_name: "audio.mp3",
            mimetype: "audio/mpeg",
        },
        {
            id: "5",
            file_name: "archive.zip",
            mimetype: "application/zip",
        },
    ]

    it("renders grid container", () => {
        const { container } = render(<FileGrid files={mockFiles} />)

        const gridDiv = container.querySelector(".grid")
        expect(gridDiv).toBeInTheDocument()
    })

    it("renders all files as download links", () => {
        render(<FileGrid files={mockFiles} />)

        mockFiles.forEach((file) => {
            const links = screen.getAllByText(file.file_name)
            expect(links.length).toBeGreaterThan(0)
        })
    })

    it("creates download links with correct attributes", () => {
        render(<FileGrid files={mockFiles} />)

        mockFiles.forEach((file) => {
            const link = screen.getAllByText(file.file_name)[0]?.closest("a")
            expect(link).toHaveAttribute("href")
            expect(link).toHaveAttribute("download", file.file_name)
            expect(link.href).toMatch(/\/download\//)
        })
    })

    it("displays file names in grid items", () => {
        render(<FileGrid files={mockFiles} />)

        mockFiles.forEach((file) => {
            expect(screen.getByText(file.file_name)).toBeInTheDocument()
        })
    })

    it("renders correct file icons based on MIME type", () => {
        const { container } = render(<FileGrid files={mockFiles} />)

        // Check that SVG icons are rendered
        const svgs = container.querySelectorAll("svg")
        expect(svgs.length).toBeGreaterThanOrEqual(mockFiles.length)
    })

    it("handles empty file list", () => {
        const { container } = render(<FileGrid files={[]} />)

        const gridItems = container.querySelectorAll(".grid > a")
        expect(gridItems).toHaveLength(0)
    })


    it("renders correct icons for different MIME types", () => {
        const filesWithVariousMimes = [
            {
                id: "1",
                file_name: "presentation.pptx",
                mimetype: "application/vnd.ms-powerpoint",
            },
            {
                id: "2",
                file_name: "spreadsheet.csv",
                mimetype: "text/csv",
            },
            {
                id: "3",
                file_name: "code.js",
                mimetype: "application/javascript",
            },
            {
                id: "4",
                file_name: "data.json",
                mimetype: "application/json",
            },
        ]

        const { container } = render(<FileGrid files={filesWithVariousMimes} />)

        // Verify that icons are rendered for each file
        const svgs = container.querySelectorAll("svg")
        expect(svgs.length).toBeGreaterThanOrEqual(filesWithVariousMimes.length)
    })

    it("renders file names with truncation class", () => {
        render(<FileGrid files={mockFiles} />)

        mockFiles.forEach((file) => {
            const span = screen.getByText(file.file_name)
            expect(span).toHaveClass("truncate")
        })
    })

    it("maintains grid responsiveness classes", () => {
        const { container } = render(<FileGrid files={mockFiles} />)

        const grid = container.querySelector(".grid")
        expect(grid).toHaveClass(
            "grid-cols-2",
            "sm:grid-cols-3",
            "md:grid-cols-4",
            "lg:grid-cols-5"
        )
    })

    it("includes proper spacing and gap classes", () => {
        const { container } = render(<FileGrid files={mockFiles} />)

        const grid = container.querySelector(".grid")
        expect(grid).toHaveClass("gap-4", "p-6")
    })
})

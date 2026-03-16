import { render, screen, fireEvent } from "@testing-library/react"
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
        expect(grid).toHaveClass("gap-3")
        expect(grid).toHaveClass("sm:gap-4")
    })

    it("renders a download button in the top-right of each card", () => {
        const { container } = render(<FileGrid files={mockFiles} />)

        const firstCard = container.querySelector("a.group")
        expect(firstCard).toBeInTheDocument()

        const downloadButton = firstCard.querySelector("button")
        expect(downloadButton).toBeInTheDocument()
        expect(downloadButton).toHaveAttribute("title", "Download")
        expect(downloadButton).toHaveAttribute(
            "aria-label",
            expect.stringContaining("Download")
        )
        expect(downloadButton.className).toContain("absolute")
        expect(downloadButton.className).toContain("top-2")
        expect(downloadButton.className).toContain("right-2")
        expect(downloadButton.className).toContain("rounded-full")
    })

    it("applies hover animation classes to the download button", () => {
        const { container } = render(<FileGrid files={mockFiles} />)

        const firstCard = container.querySelector("a.group")
        const downloadButton = firstCard.querySelector("button")

        const className = downloadButton.className
        expect(className).toContain("opacity-0")
        expect(className).toContain("group-hover:opacity-100")
        expect(className).toContain("scale-90")
        expect(className).toContain("group-hover:scale-100")
        expect(className).toContain("transition-all")
    })

    it("keeps download button triggering the same download link", () => {
        const { container } = render(<FileGrid files={mockFiles} />)

        const firstCard = container.querySelector("a.group")
        const downloadButton = firstCard.querySelector("button")

        // Button lives inside the same anchor, so clicking it should
        // activate the same download link without errors.
        expect(downloadButton.closest("a")).toBe(firstCard)
        fireEvent.click(downloadButton)
    })
})

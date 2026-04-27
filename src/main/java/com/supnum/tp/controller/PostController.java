package com.supnum.tp.controller;

import com.supnum.tp.dto.PostDTO;
import com.supnum.tp.model.Post;
import com.supnum.tp.service.PostService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import org.springframework.messaging.simp.SimpMessagingTemplate;

@RestController
@RequestMapping("/courses/{courseId}/posts")
public class PostController {

    @Autowired
    private PostService postService;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @GetMapping
    public List<Post> getPosts(@PathVariable Long courseId) {
        return postService.getPostsForCourse(courseId);
    }

    @PostMapping
    public Post createPost(@PathVariable Long courseId, @RequestBody PostDTO dto) {
        Post post = postService.createPost(courseId, dto);
        messagingTemplate.convertAndSend("/topic/updates/" + courseId, "REFRESH_DATA");
        return post;
    }

    @DeleteMapping("/{postId}")
    public void deletePost(@PathVariable Long courseId, @PathVariable Long postId) {
        postService.deletePost(postId);
        messagingTemplate.convertAndSend("/topic/updates/" + courseId, "REFRESH_DATA");
    }
}
